"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, ArrowUp, Settings, Atom, Plus, MessageSquare, PanelLeftClose, PanelLeft, Loader2, CheckCircle2, ArrowRight, Factory, FlaskConical, Wind, Wine } from "lucide-react";
import { PLANT_TEMPLATES } from "@/lib/plant/templates";
import { useAppStore } from "@/lib/store/useAppStore";
import { cn } from "@/lib/utils";
import { SettingsDrawer } from "./SettingsDrawer";

interface WelcomeScreenProps {
  onBuild: (command: string) => void;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  status?: "building" | "ready";
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
  const [command, setCommand] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<{ id: string; title: string }[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const wasGeneratingRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Watch for build completion
  useEffect(() => {
    if (isGenerating) {
      wasGeneratingRef.current = true;
    } else if (wasGeneratingRef.current && currentPlant) {
      wasGeneratingRef.current = false;
      Promise.resolve().then(() => {
        setMessages((prev) => [...prev, {
          id: Date.now() + "r",
          role: "assistant",
          content: `Done — the ${currentPlant.name.split(" (")[0]} is ready. Click below to enter.`,
          status: "ready",
        }]);
      });
    }
  }, [isGenerating, currentPlant]);

  const sendMessage = (text: string) => {
    if (!text.trim() || isGenerating) return;
    const userMsg: ChatMessage = { id: Date.now() + "u", role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);

    const lower = text.toLowerCase();
    const isBuildRequest = lower.includes("build") || lower.includes("ammonia") || lower.includes("distillation") || lower.includes("sulfuric") || lower.includes("ethanol") || lower.includes("plant");

    if (isBuildRequest) {
      setTimeout(() => {
        setMessages((prev) => [...prev, {
          id: Date.now() + "b",
          role: "assistant",
          content: "On it — assembling the plant now. Give me a few seconds.",
          status: "building",
        }]);
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
                    {/* Accent glow */}
                    <div
                      className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-20"
                      style={{ background: ACCENT[tpl.id] }}
                    />
                    {/* Icon */}
                    <div
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ring-1 transition-transform group-hover:scale-110"
                      style={{
                        background: `${ACCENT[tpl.id]}15`,
                        color: ACCENT[tpl.id],
                        borderColor: `${ACCENT[tpl.id]}30`,
                      }}
                    >
                      {ICONS[tpl.id]}
                    </div>
                    {/* Text */}
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-semibold text-white">
                        {tpl.name.split(" (")[0]}
                      </div>
                      <div className="mt-0.5 line-clamp-1 text-[10px] text-slate-500">
                        {tpl.tagline}
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="text-[9px] text-slate-600">{tpl.equipment.length} units · {tpl.estimatedTime}m</span>
                        <span
                          className={cn(
                            "rounded px-1 py-0.5 text-[7px] font-medium uppercase",
                            tpl.difficulty === "Beginner" && "bg-emerald-500/10 text-emerald-400",
                            tpl.difficulty === "Intermediate" && "bg-amber-500/10 text-amber-400"
                          )}
                        >
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
          /* Input stays at top (centered), messages flow below it */
          <div className="flex flex-1 flex-col px-6 pt-[12vh] pb-6">
            {/* Input — stays in its original centered position */}
            <div className="mx-auto w-full max-w-xl">
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
            </div>

            {/* Messages flow below the input, scrollable */}
            <div ref={scrollRef} className="mx-auto mt-6 w-full max-w-xl flex-1 overflow-y-auto">
              <div className="space-y-3 pb-4">
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} onEnterSim={() => onBuild("__enter_sim__")} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

/** Nice chat bubbles — user on right (sky), AI on left (dark glass) */
function MessageBubble({ message, onEnterSim }: { message: ChatMessage; onEnterSim: () => void }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-sky-500 px-4 py-2.5 text-[13px] leading-relaxed text-white shadow-lg shadow-sky-500/10">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%]">
        <div className="rounded-2xl rounded-bl-md border border-white/10 bg-[#2a2a2a] px-4 py-2.5 text-[13px] leading-relaxed text-slate-100 shadow-lg">
          {message.content}
        </div>

        {/* Building status — inline below the bubble */}
        {message.status === "building" && (
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-sky-500/20 bg-sky-500/5 px-3 py-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-400" />
            <span className="text-[11px] font-medium text-sky-300">Building plant…</span>
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-black/40">
              <div className="h-full w-1/3 animate-pulse rounded-full bg-sky-400" />
            </div>
          </div>
        )}

        {/* Ready card — green with enter button */}
        {message.status === "ready" && (
          <div className="mt-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="text-[12px] font-medium text-emerald-300">Plant ready</span>
            </div>
            <button
              onClick={onEnterSim}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-[12px] font-medium text-white transition-colors hover:bg-emerald-400"
            >
              Enter simulation <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
