"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, ArrowUp, Settings, Atom, Plus, MessageSquare, PanelLeftClose, PanelLeft, Loader2, CheckCircle2, ArrowRight, Factory, FlaskConical, Wind, Wine, Bell, LogOut } from "lucide-react";
import { PLANT_TEMPLATES } from "@/lib/plant/templates";
import { useAppStore } from "@/lib/store/useAppStore";
import { cn } from "@/lib/utils";
import { SettingsDrawer } from "./SettingsDrawer";
import type { PlantTemplate } from "@/lib/plant/types";

interface WelcomeScreenProps {
  onBuild: (command: string) => void;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  status?: "building" | "ready" | "narration" | "restored";
  progress?: number; // 0-100 live progress
  stages?: string[];
  equipmentCount?: number;
}

/**
 * Generates the narration script + renders audio segments.
 * Sends the full plant object so the LLM has the layout-engine output.
 * Stores the result in window.__preGeneratedTour.
 */
async function generateTourForChat(plant: PlantTemplate, onProgress?: (progress: number) => void): Promise<void> {
  try {
    // Step 1: Generate the narration script
    if (onProgress) onProgress(5); // script generation starting
    const scriptRes = await fetch("/api/generate-tour", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plant }),
    });
    if (!scriptRes.ok) return;
    if (onProgress) onProgress(15); // script generated
    const scriptData = await scriptRes.json();
    const segments: { text: string; equipmentId?: string; emotion?: string }[] = scriptData.segments || [];
    if (segments.length === 0) return;

    // Step 2: Render each segment to audio via TTS
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const buffers: AudioBuffer[] = [];
    let allFailed = false;

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      try {
        const ttsRes = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: segment.text }),
        });
        if (!ttsRes.ok) throw new Error("TTS failed");
        const contentType = ttsRes.headers.get("content-type") || "";
        if (!contentType.includes("audio")) {
          throw new Error("Server signaled fallback");
        }
        const arrayBuffer = await ttsRes.arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        buffers.push(audioBuffer);
      } catch {
        const silence = audioCtx.createBuffer(1, audioCtx.sampleRate * 1, audioCtx.sampleRate);
        buffers.push(silence);
        allFailed = true;
      }
      // Report progress: 15% (script done) to 95% (all segments done)
      const segmentProgress = 15 + ((i + 1) / segments.length) * 80;
      if (onProgress) onProgress(Math.round(segmentProgress));
    }

    if (onProgress) onProgress(100);

    (window as any).__preGeneratedTour = {
      segments,
      audioBuffers: buffers,
      audioContext: audioCtx,
      ready: true,
      useBrowserTTS: allFailed,
    };
    console.log(`[tour] Chat-phase pre-generated ${segments.length} segments`);
  } catch (err) {
    console.error("[tour] chat-phase generation failed", err);
  }
}

const ICONS: Record<string, React.ReactNode> = {
  ammonia: <Factory className="h-4 w-4" />,
  distillation: <FlaskConical className="h-4 w-4" />,
  "sulfuric-acid": <Wind className="h-4 w-4" />,
  ethanol: <Wine className="h-4 w-4" />,
};

const ACCENT: Record<string, string> = {
  ammonia: "#3b82f6",
  distillation: "#a855f7",
  "sulfuric-acid": "#ef4444",
  ethanol: "#10b981",
};

export function WelcomeScreen({ onBuild }: WelcomeScreenProps) {
  const isGenerating = useAppStore((s) => s.isGenerating);
  const currentPlant = useAppStore((s) => s.currentPlant);
  const setGenerating = useAppStore((s) => s.setGenerating);
  const setNarrationReady = useAppStore((s) => s.setNarrationReady);
  const setPlant = useAppStore((s) => s.setPlant);
  const [command, setCommand] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<{ id: string; title: string }[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationPerm, setNotificationPerm] = useState<NotificationPermission | "default">(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const prevPlantRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  // Preload any GLB models in the registry so they're cached by the time
  // the user enters the simulation. Procedural fallback handles the gap.
  useEffect(() => {
    import("@/components/scene/models/EquipmentRenderer").then((mod) => {
      mod.preloadRegistryModels();
    });
  }, []);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // ─── On mount: try to restore a previously-built plant from localStorage ───
  // This is the "you can leave, we'll notify you" UX. If the user refreshed
  // mid-build, the plant itself was already saved by usePlantBuilder; we just
  // need to surface it back in the chat as a "ready to enter" card.
  useEffect(() => {
    try {
      const raw = localStorage.getItem("plant-explorer:current-plant");
      if (!raw) return;
      const data = JSON.parse(raw) as {
        plant: PlantTemplate;
        intro: string;
        builtAt: number;
      };
      if (!data.plant || !data.plant.id) return;
      // Don't auto-restore if a build is already in progress
      if (currentPlant) return;
      const plantName = data.plant.name.split(" (")[0];
      setMessages([{
        id: Date.now() + "r-restore",
        role: "assistant",
        content: `Welcome back. Your ${plantName} (${data.plant.equipment.length} equipment pieces) is still here from your last visit. Click below to enter, or start a new build.`,
        status: "restored",
      }]);
    } catch {
      // ignore parse errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Request notification permission lazily (only when a build starts) ───
  const ensureNotificationPermission = useCallback(async () => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "default") {
      const perm = await Notification.requestPermission();
      setNotificationPerm(perm);
    }
  }, []);

  // ─── Show a desktop notification when the tour is ready ───
  const notifyTourReady = useCallback((plantName: string) => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;
    try {
      new Notification("Your plant is ready", {
        body: `${plantName} tour narration is generated. Click to enter the simulation.`,
        tag: "plant-ready",
      });
    } catch {
      // some browsers throw if icon is missing etc. — non-fatal
    }
  }, []);

  // ─── Enter a restored plant (from localStorage) ───
  const enterRestoredPlant = useCallback(() => {
    try {
      const raw = localStorage.getItem("plant-explorer:current-plant");
      if (!raw) return;
      const data = JSON.parse(raw) as {
        plant: PlantTemplate;
        intro: string;
      };
      if (!data.plant) return;
      setPlant(data.plant, data.intro);
      setNarrationReady(true);
      onBuild("__enter_sim__");
    } catch {
      // ignore
    }
  }, [setPlant, setNarrationReady, onBuild]);

  // Watch for plant being loaded (currentPlant set, isGenerating still true)
  useEffect(() => {
    if (currentPlant && currentPlant.id !== prevPlantRef.current) {
      prevPlantRef.current = currentPlant.id;
      const plantName = currentPlant.name.split(" (")[0];

      // Show narration status immediately (deferred to avoid effect-setState lint)
      const narrationMsgId = Date.now() + "n";
      Promise.resolve().then(() => {
        setMessages((prev) => [...prev, {
          id: narrationMsgId,
          role: "assistant",
          content: `Plant built — ${currentPlant.equipment.length} pieces across ${currentPlant.areas?.length ?? 0} process areas. Now generating your guided tour narration. This takes about a minute — feel free to leave the tab, I'll let you know when it's ready.`,
          status: "narration",
          progress: 0,
        }]);
      });

      // Generate the tour script + audio in the background, then update the message
      generateTourForChat(currentPlant, (progress: number) => {
        setMessages((prev) => prev.map((m) =>
          m.id === narrationMsgId ? { ...m, progress } : m
        ));
      }).then(() => {
        setNarrationReady(true);
        setGenerating(false);
        notifyTourReady(plantName);
        setMessages((prev) => [...prev, {
          id: Date.now() + "r",
          role: "assistant",
          content: `Done — the ${plantName} is ready with a guided audio tour. Click below to enter.`,
          status: "ready",
        }]);
      });
    }
  }, [currentPlant, setGenerating, setNarrationReady, notifyTourReady]);

  const sendMessage = (text: string) => {
    if (!text.trim() || isGenerating) return;
    const userMsg: ChatMessage = { id: Date.now() + "u", role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);

    const lower = text.toLowerCase();
    const isBuildRequest = lower.includes("build") || lower.includes("ammonia") || lower.includes("distillation") || lower.includes("sulfuric") || lower.includes("ethanol") || lower.includes("plant");

    if (isBuildRequest) {
      // Ask for notification permission so we can ping the user when the
      // tour is ready — they can leave the tab and still get notified.
      ensureNotificationPermission();
      const buildingMsgId = Date.now() + "b";
      setTimeout(() => {
        setMessages((prev) => [...prev, {
          id: buildingMsgId,
          role: "assistant",
          content: "On it — assembling the plant now. Give me a few seconds.",
          status: "building",
          progress: 0,
        }]);
        // Animate the building progress bar
        let prog = 0;
        const buildInterval = setInterval(() => {
          prog += 15 + Math.random() * 10;
          if (prog >= 90) {
            prog = 90;
            clearInterval(buildInterval);
          }
          setMessages((prev) => prev.map((m) =>
            m.id === buildingMsgId ? { ...m, progress: prog } : m
          ));
        }, 300);
      }, 500);
      const convId = Date.now().toString();
      const title = text.length > 30 ? text.slice(0, 30) + "…" : text;
      setConversations((prev) => [{ id: convId, title }, ...prev]);
      onBuild(text.trim());
    } else {
      setTimeout(() => {
        setMessages((prev) => [...prev, {
          id: Date.now() + "a",
          role: "assistant",
          content: "I can build you a chemical plant and walk you through it. Which one — ammonia, distillation, sulfuric acid, or ethanol?",
        }]);
      }, 600);
    }
    setCommand("");
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="absolute inset-0 z-30 flex h-screen bg-[#1f1f1f]">
      {/* Collapsible sidebar — ChatGPT style */}
      <aside
        className={cn(
          "flex flex-col border-r border-black/30 bg-[#1a1a1a] transition-all duration-200",
          sidebarOpen ? "w-60" : "w-12"
        )}
      >
        {/* Top: toggle button (hamburger) */}
        <div className="p-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
          </button>
        </div>

        {/* New chat button */}
        <div className="px-2">
          {sidebarOpen ? (
            <button
              onClick={() => { setMessages([]); setCommand(""); }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[12px] text-slate-300 transition-colors hover:bg-white/5"
            >
              <Plus className="h-4 w-4 flex-shrink-0" />
              <span>New chat</span>
            </button>
          ) : (
            <button
              onClick={() => { setMessages([]); setCommand(""); }}
              aria-label="New chat"
              title="New chat"
              className="mx-auto flex h-8 w-8 items-center justify-center rounded-md text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Plus className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Conversation history */}
        <div className="flex-1 overflow-y-auto px-2 pt-2">
          {sidebarOpen && conversations.length > 0 && (
            <div className="space-y-0.5">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[11px] text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200"
                >
                  <MessageSquare className="h-3.5 w-3.5 flex-shrink-0 text-slate-600" />
                  <span className="flex-1 truncate">{conv.title}</span>
                </button>
              ))}
            </div>
          )}
          {!sidebarOpen && conversations.length > 0 && (
            <div className="space-y-1">
              {conversations.slice(0, 8).map((conv) => (
                <button
                  key={conv.id}
                  title={conv.title}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-white/10 hover:text-slate-200"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Settings at bottom */}
        <div className="border-t border-black/30 p-2">
          {sidebarOpen ? (
            <button
              onClick={() => setSettingsOpen(true)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[11px] text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200"
            >
              <Settings className="h-4 w-4 flex-shrink-0" />
              <span>Settings</span>
            </button>
          ) : (
            <button
              onClick={() => setSettingsOpen(true)}
              aria-label="Settings"
              title="Settings"
              className="mx-auto flex h-8 w-8 items-center justify-center rounded-md text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Settings className="h-5 w-5" />
            </button>
          )}
        </div>
      </aside>

      {/* Main chat area */}
      <div className="flex flex-1 flex-col">
        {/* Minimal header */}
        <header className="flex items-center gap-2.5 px-5 py-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-200">
            <Atom className="h-3 w-3 text-slate-900" />
          </div>
          <span className="text-[12px] font-medium text-slate-300">AI Chemical Plant Explorer</span>
        </header>

        {!hasMessages ? (
          /* Empty state — centered input + plant card grid below */
          <div className="flex flex-1 flex-col items-center justify-center px-6">
            <div className="w-full max-w-xl">
              <p className="mb-3 text-center text-[11px] text-slate-500">
                What do you want to explore?
              </p>
              <form
                onSubmit={(e) => { e.preventDefault(); sendMessage(command); }}
                className="relative"
              >
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#2a2a2a] px-3 py-3 transition-colors focus-within:border-white/20">
                  <button type="button" aria-label="Voice input" className="flex h-6 w-6 items-center justify-center rounded-md text-slate-500 transition-colors hover:text-sky-300">
                    <Mic className="h-4 w-4" />
                  </button>
                  <input
                    ref={inputRef}
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    placeholder="Build an ammonia plant…"
                    disabled={isGenerating}
                    className="flex-1 bg-transparent text-[14px] text-white placeholder:text-slate-600 outline-none disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={isGenerating || !command.trim()}
                    aria-label="Send"
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-md transition-colors",
                      command.trim() && !isGenerating ? "bg-sky-500 text-white hover:bg-sky-400" : "bg-white/5 text-slate-600"
                    )}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                </div>
              </form>

              {/* Plant suggestion cards — 2x2 grid below the input */}
              <div className="mt-5 grid grid-cols-2 gap-2.5">
                {PLANT_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => sendMessage(`Build a ${tpl.name.toLowerCase().split(" ")[0]} plant`)}
                    disabled={isGenerating}
                    className={cn(
                      "group relative flex items-start gap-2.5 overflow-hidden rounded-xl border border-white/10 bg-[#252525] p-3 text-left transition-all",
                      "hover:border-white/20 hover:bg-[#2d2d2d] disabled:cursor-not-allowed disabled:opacity-40"
                    )}
                  >
                    <div
                      className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-20"
                      style={{ background: ACCENT[tpl.id] }}
                    />
                    <div
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ring-1 transition-transform group-hover:scale-110"
                      style={{ background: `${ACCENT[tpl.id]}15`, color: ACCENT[tpl.id], borderColor: `${ACCENT[tpl.id]}30` }}
                    >
                      {ICONS[tpl.id]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-semibold text-white">{tpl.name.split(" (")[0]}</div>
                      <div className="mt-0.5 line-clamp-1 text-[10px] text-slate-500">{tpl.tagline}</div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="text-[9px] text-slate-600">{tpl.equipment.length} units · {tpl.estimatedTime}m</span>
                        <span className={cn("rounded px-1 py-0.5 text-[7px] font-medium uppercase", tpl.difficulty === "Beginner" && "bg-emerald-500/10 text-emerald-400", tpl.difficulty === "Intermediate" && "bg-amber-500/10 text-amber-400")}>
                          {tpl.difficulty}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ChatGPT layout — messages scroll above, input fixed at bottom */
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
              <div className="mx-auto max-w-xl space-y-2.5">
                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    onEnterSim={() => onBuild("__enter_sim__")}
                    onEnterRestored={enterRestoredPlant}
                  />
                ))}
              </div>
            </div>

            {/* Input fixed at bottom */}
            <div className="px-6 pb-4">
              <div className="mx-auto max-w-xl">
                <form onSubmit={(e) => { e.preventDefault(); sendMessage(command); }} className="relative">
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#2a2a2a] px-3 py-2.5 transition-colors focus-within:border-white/20">
                    <button type="button" aria-label="Voice input" className="flex h-5 w-5 items-center justify-center rounded-md text-slate-500 transition-colors hover:text-sky-300">
                      <Mic className="h-3.5 w-3.5" />
                    </button>
                    <input
                      value={command}
                      onChange={(e) => setCommand(e.target.value)}
                      placeholder="Ask a follow-up…"
                      disabled={isGenerating}
                      className="flex-1 bg-transparent text-[13px] text-white placeholder:text-slate-600 outline-none disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={isGenerating || !command.trim()}
                      aria-label="Send"
                      className={cn("flex h-5 w-5 items-center justify-center rounded-md transition-colors", command.trim() && !isGenerating ? "bg-sky-500 text-white hover:bg-sky-400" : "bg-white/5 text-slate-600")}
                    >
                      <ArrowUp className="h-3 w-3" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </>
        )}
      </div>

      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

/** Chat bubbles — user on right (sky), AI on left (dark glass) */
function MessageBubble({
  message,
  onEnterSim,
  onEnterRestored,
}: {
  message: ChatMessage;
  onEnterSim: () => void;
  onEnterRestored: () => void;
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-xl rounded-br-sm bg-sky-500 px-3 py-2 text-[12px] leading-relaxed text-white shadow-lg shadow-sky-500/10">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%]">
        <div className="rounded-xl rounded-bl-sm border border-white/10 bg-[#2a2a2a] px-3 py-2 text-[12px] leading-relaxed text-slate-100 shadow-lg">
          {message.content}
        </div>

        {message.status === "building" && (
          <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-sky-500/20 bg-sky-500/5 px-2.5 py-1.5">
            <Loader2 className="h-3 w-3 animate-spin text-sky-400" />
            <span className="text-[10px] font-medium text-sky-300">Building plant…</span>
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-black/40">
              <div
                className="h-full rounded-full bg-sky-400 transition-all duration-300"
                style={{ width: `${message.progress ?? 0}%` }}
              />
            </div>
            {message.progress !== undefined && (
              <span className="text-[9px] text-slate-500">{Math.round(message.progress)}%</span>
            )}
          </div>
        )}

        {message.status === "narration" && (
          <div className="mt-1.5 space-y-2">
            <div className="flex items-center gap-2 rounded-lg border border-violet-500/20 bg-violet-500/5 px-2.5 py-1.5">
              <Loader2 className="h-3 w-3 animate-spin text-violet-400" />
              <span className="text-[10px] font-medium text-violet-300">Generating tour narration…</span>
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-black/40">
                <div
                  className="h-full rounded-full bg-violet-400 transition-all duration-300"
                  style={{ width: `${message.progress ?? 0}%` }}
                />
              </div>
              {message.progress !== undefined && (
                <span className="text-[9px] text-slate-500">{Math.round(message.progress)}%</span>
              )}
            </div>
            <div className="flex items-start gap-1.5 rounded-md bg-amber-500/5 px-2 py-1 text-[9px] text-amber-300/80">
              <Bell className="mt-px h-2.5 w-2.5 flex-shrink-0" />
              <span>You can leave this tab — I&apos;ll send a notification when the tour is ready.</span>
            </div>
          </div>
        )}

        {message.status === "restored" && (
          <div className="mt-1.5 rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5">
            <div className="flex items-center gap-2">
              <LogOut className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-[11px] font-medium text-amber-300">Welcome back</span>
            </div>
            <button
              onClick={onEnterRestored}
              className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-amber-400"
            >
              Enter your previous plant <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        )}

        {message.status === "ready" && (
          <div className="mt-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[11px] font-medium text-emerald-300">Plant ready</span>
            </div>
            <button
              onClick={onEnterSim}
              className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-emerald-400"
            >
              Enter simulation <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
