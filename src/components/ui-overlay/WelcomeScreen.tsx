"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, ArrowRight, Settings, Atom, Bot, User, Plus, MessageSquare, Loader2, ArrowUp, CheckCircle2 } from "lucide-react";
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

const SUGGESTIONS = [
  "Build an ammonia plant",
  "Build a distillation plant",
  "Build a sulfuric acid plant",
  "Build an ethanol plant",
];

export function WelcomeScreen({ onBuild }: WelcomeScreenProps) {
  const isGenerating = useAppStore((s) => s.isGenerating);
  const currentPlant = useAppStore((s) => s.currentPlant);
  const [command, setCommand] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<{ id: string; title: string; date: string }[]>([]);
  const wasGeneratingRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Watch for build completion — when isGenerating goes true→false and a
  // plant is loaded, add the "ready" message with the enter link.
  useEffect(() => {
    if (isGenerating) {
      wasGeneratingRef.current = true;
    } else if (wasGeneratingRef.current && currentPlant) {
      wasGeneratingRef.current = false;
      // Use a microtask to defer the state update out of the effect body
      Promise.resolve().then(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + "r",
            role: "assistant",
            content: `Done! The ${currentPlant.name.split(" (")[0]} is ready. Click below to enter the simulation — I'll meet you inside.`,
            status: "ready",
          },
        ]);
      });
    }
  }, [isGenerating, currentPlant]);

  const sendMessage = (text: string) => {
    if (!text.trim() || isGenerating) return;
    const userMsg: ChatMessage = { id: Date.now() + "u", role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);

    // Check if this is a plant build request
    const lower = text.toLowerCase();
    const isBuildRequest = lower.includes("build") || lower.includes("ammonia") || lower.includes("distillation") || lower.includes("sulfuric") || lower.includes("ethanol") || lower.includes("plant");

    if (isBuildRequest) {
      // AI says it's building
      setTimeout(() => {
        const buildingMsg: ChatMessage = {
          id: Date.now() + "b",
          role: "assistant",
          content: "On it. I'm assembling the plant now — this'll take a few seconds. Hang tight.",
          status: "building",
        };
        setMessages((prev) => [...prev, buildingMsg]);
      }, 600);

      // Add to conversation history
      const convId = Date.now().toString();
      const title = text.length > 30 ? text.slice(0, 30) + "…" : text;
      setConversations((prev) => [{ id: convId, title, date: "Just now" }, ...prev]);

      // Trigger the actual build
      onBuild(text.trim());
    } else {
      // Non-build question — AI asks for clarification
      setTimeout(() => {
        const clarifyMsg: ChatMessage = {
          id: Date.now() + "a",
          role: "assistant",
          content: "I can build you a chemical plant and walk you through it. Which one are you after — ammonia, distillation, sulfuric acid, or ethanol? Or describe what you want to learn and I'll pick the right one.",
        };
        setMessages((prev) => [...prev, clarifyMsg]);
      }, 800);
    }

    setCommand("");
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="absolute inset-0 z-30 flex h-screen bg-[#08090c]">
      {/* Sidebar — conversation history (like ChatGPT) */}
      <aside className="hidden w-60 flex-col border-r border-slate-900 bg-[#0a0b0f] sm:flex">
        {/* New chat button */}
        <div className="p-3">
          <button
            onClick={() => { setMessages([]); setCommand(""); }}
            className="flex w-full items-center gap-2 rounded-lg border border-slate-800 px-3 py-2 text-[12px] text-slate-300 transition-colors hover:bg-slate-900"
          >
            <Plus className="h-3.5 w-3.5" />
            New chat
          </button>
        </div>

        {/* Conversation history */}
        <div className="flex-1 overflow-y-auto px-2">
          {conversations.length === 0 ? (
            <div className="px-2 py-4 text-center text-[10px] text-slate-600">
              No conversations yet
            </div>
          ) : (
            <div className="space-y-0.5">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-[11px] text-slate-400 transition-colors hover:bg-slate-900 hover:text-slate-200"
                >
                  <MessageSquare className="h-3 w-3 flex-shrink-0 text-slate-600" />
                  <span className="flex-1 truncate">{conv.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-900 p-3">
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[11px] text-slate-400 transition-colors hover:bg-slate-900 hover:text-slate-200"
          >
            <Settings className="h-3.5 w-3.5" />
            Settings
          </button>
        </div>
      </aside>

      {/* Main chat area */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100">
              <Atom className="h-3.5 w-3.5 text-slate-900" />
            </div>
            <span className="text-[12px] font-medium text-slate-300">AI Chemical Plant Explorer</span>
          </div>
          <button
            onClick={() => setSettingsOpen(true)}
            aria-label="Settings"
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-900 hover:text-slate-200 sm:hidden"
          >
            <Settings className="h-4 w-4" />
          </button>
        </header>

        {/* Chat area — empty state OR message thread */}
        {!hasMessages ? (
          /* Empty state — centered input + suggestions */
          <div className="flex flex-1 flex-col items-center justify-center px-6">
            <div className="w-full max-w-lg">
              <div className="mb-6 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10 ring-1 ring-sky-500/30 mx-auto">
                  <Bot className="h-6 w-6 text-sky-300" />
                </div>
                <h1 className="text-[20px] font-semibold text-white">What plant do you want to explore?</h1>
                <p className="mt-1 text-[12px] text-slate-500">Describe a plant or pick one below</p>
              </div>

              {/* Input */}
              <form
                onSubmit={(e) => { e.preventDefault(); sendMessage(command); }}
                className="relative"
              >
                <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-3 transition-colors focus-within:border-slate-600">
                  <button type="button" aria-label="Voice input" className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-800 hover:text-sky-300">
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
                      "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
                      command.trim() && !isGenerating
                        ? "bg-sky-500 text-white hover:bg-sky-400"
                        : "bg-slate-800 text-slate-600"
                    )}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                </div>
              </form>

              {/* Suggestion chips */}
              <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    disabled={isGenerating}
                    className="rounded-full border border-slate-800 bg-slate-950/50 px-3 py-1.5 text-[11px] text-slate-400 transition-colors hover:border-slate-700 hover:bg-slate-900 hover:text-slate-200 disabled:opacity-40"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Message thread — messages flow above, input fixed at bottom */
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4">
              <div className="mx-auto max-w-2xl space-y-4">
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} onEnterSim={() => onBuild("__enter_sim__")} />
                ))}
                {isGenerating && (
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Building plant…
                  </div>
                )}
              </div>
            </div>

            {/* Input fixed at bottom */}
            <div className="border-t border-slate-900 px-6 py-3">
              <div className="mx-auto max-w-2xl">
                <form
                  onSubmit={(e) => { e.preventDefault(); sendMessage(command); }}
                  className="relative"
                >
                  <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2.5 transition-colors focus-within:border-slate-600">
                    <button type="button" aria-label="Voice input" className="flex h-6 w-6 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-800 hover:text-sky-300">
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
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-md transition-colors",
                        command.trim() && !isGenerating
                          ? "bg-sky-500 text-white hover:bg-sky-400"
                          : "bg-slate-800 text-slate-600"
                      )}
                    >
                      <ArrowUp className="h-3 w-3" />
                    </button>
                  </div>
                </form>
                <p className="mt-1.5 text-center text-[9px] text-slate-700">
                  The AI may ask clarifying questions to get the design right
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Settings drawer */}
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

function MessageBubble({ message, onEnterSim }: { message: ChatMessage; onEnterSim: () => void }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end gap-2.5">
        <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-sky-500 px-3.5 py-2 text-[13px] text-white shadow-lg">
          {message.content}
        </div>
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-800">
          <User className="h-3.5 w-3.5 text-slate-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start gap-2.5">
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-sky-500/15 ring-1 ring-sky-500/30">
        <Bot className="h-3.5 w-3.5 text-sky-300" />
      </div>
      <div className="max-w-[88%]">
        <div className="rounded-2xl rounded-bl-sm bg-slate-800/80 px-3.5 py-2 text-[13px] text-slate-100 shadow-lg ring-1 ring-white/5">
          {message.content}
        </div>

        {/* Building status card */}
        {message.status === "building" && (
          <div className="mt-2 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <div className="flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-400" />
              <span className="text-[11px] font-medium text-slate-300">Building plant…</span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full w-1/3 animate-pulse rounded-full bg-sky-400" />
            </div>
            <p className="mt-2 text-[10px] text-slate-500">Assembling equipment, pipes, and structures. This usually takes a few seconds.</p>
          </div>
        )}

        {/* Ready card with link to simulation */}
        {message.status === "ready" && (
          <div className="mt-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[11px] font-medium text-emerald-300">Plant ready</span>
            </div>
            <button
              onClick={onEnterSim}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-[12px] font-medium text-white transition-colors hover:bg-emerald-400"
            >
              Enter simulation <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
