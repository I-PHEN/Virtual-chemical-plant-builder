"use client";

import { useEffect, useRef, useState } from "react";
import { Send, MessageSquare, X, Bot, User, Mic, MicOff } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { cn } from "@/lib/utils";
import type { AssistantAction } from "@/lib/plant/types";

interface ChatPanelProps {
  onSend: (text: string) => void;
  busy: boolean;
}

export function ChatPanel({ onSend, busy }: ChatPanelProps) {
  const messages = useAppStore((s) => s.messages);
  const isListening = useAppStore((s) => s.isListening);
  const setListening = useAppStore((s) => s.setListening);
  const voiceEnabled = useAppStore((s) => s.voiceEnabled);
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  // Voice input via Web Speech API
  const recognitionRef = useRef<any>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-US";
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setListening(false);
      // Auto-send after voice recognition
      submit(transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
  }, [setListening]);

  const toggleVoice = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setListening(true);
      } catch {
        // already started
      }
    }
  };

  const submit = (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    onSend(t);
    setInput("");
  };

  return (
    <div
      className={cn(
        "pointer-events-auto flex flex-col overflow-hidden border border-slate-700/50 bg-slate-950/90 shadow-2xl backdrop-blur-xl transition-all duration-200",
        "rounded-2xl",
        open
          ? "h-[440px] w-[360px]"
          : "h-11 w-11 rounded-full ring-1 ring-sky-500/20"
      )}
    >
      {open ? (
        <>
          {/* header with gradient */}
          <div className="flex items-center justify-between border-b border-slate-800/60 bg-gradient-to-r from-slate-900/80 to-slate-800/40 px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/20 to-cyan-500/10 ring-1 ring-sky-400/30">
                <Bot className="h-3.5 w-3.5 text-sky-300" />
                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
              </div>
              <div>
                <div className="text-[12px] font-semibold text-slate-100">AI Engineer</div>
                <div className="text-[9px] text-emerald-400">online</div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Collapse"
              className="rounded-lg p-1 text-slate-500 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* messages */}
          <div ref={scrollRef} className="flex-1 space-y-2.5 overflow-y-auto px-3 py-3">
            {messages.length === 0 && (
              <div className="px-1 py-6 text-center">
                <p className="text-[11px] text-slate-500">Ask me anything. Try:</p>
                <div className="mt-3 space-y-1.5">
                  {["Take me through the plant", "What does this reactor do?", "Quiz me"].map((s) => (
                    <button
                      key={s}
                      onClick={() => onSend(s)}
                      className="block w-full rounded-lg border border-slate-800/60 bg-slate-900/40 px-2.5 py-1.5 text-[11px] text-slate-400 transition-all hover:border-sky-500/30 hover:bg-slate-800/60 hover:text-sky-200"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m) => (
              <MessageBubble key={m.id} role={m.role} content={m.content} action={m.action} />
            ))}
            {busy && (
              <div className="flex items-center gap-2 px-1 text-[10px] text-slate-500">
                <span className="flex gap-0.5">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sky-400 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sky-400 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sky-400" />
                </span>
                <span className="text-slate-400">thinking…</span>
              </div>
            )}
          </div>

          {/* input */}
          <div className="border-t border-slate-800/60 bg-slate-900/40 p-2.5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit(input);
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question…"
                disabled={busy}
                className="flex-1 rounded-lg border border-slate-700/60 bg-slate-900/70 px-3 py-2 text-[12px] text-white placeholder:text-slate-600 outline-none transition-colors focus:border-sky-500/50 focus:bg-slate-900 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={toggleVoice}
                aria-label={isListening ? "Stop voice input" : "Start voice input"}
                className={cn(
                  "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-all",
                  isListening
                    ? "bg-red-500/20 text-red-400 ring-2 ring-red-500/40 animate-pulse"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                )}
              >
                {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
              </button>
              <button
                type="submit"
                disabled={busy || !input.trim()}
                aria-label="Send"
                className={cn(
                  "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-all",
                  input.trim() && !busy
                    ? "bg-sky-500 text-white hover:bg-sky-400 shadow-lg shadow-sky-500/20"
                    : "bg-slate-800 text-slate-600"
                )}
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </>
      ) : (
        <button
          onClick={() => {
            setOpen(true);
            setTimeout(() => inputRef.current?.focus(), 200);
          }}
          aria-label="Open chat"
          className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-sky-500/15 to-slate-800/40 text-sky-300 transition-all hover:from-sky-500/25 hover:text-sky-200"
        >
          <MessageSquare className="h-4.5 w-4.5" />
        </button>
      )}
    </div>
  );
}

function MessageBubble({
  role,
  content,
  action,
}: {
  role: "user" | "assistant" | "system";
  content: string;
  action?: AssistantAction;
}) {
  if (role === "user") {
    return (
      <div className="flex justify-end gap-2">
        <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-gradient-to-br from-sky-500 to-sky-600 px-3 py-2 text-[12px] leading-relaxed text-white shadow-lg shadow-sky-500/10">
          {content}
        </div>
        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-800 ring-1 ring-slate-700">
          <User className="h-3 w-3 text-slate-400" />
        </div>
      </div>
    );
  }
  if (role === "system") {
    return (
      <div className="flex justify-center">
        <div className="rounded-full bg-slate-800/60 px-2.5 py-1 text-[10px] text-slate-500">
          {content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start gap-2">
      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/20 to-cyan-500/10 ring-1 ring-sky-400/30">
        <Bot className="h-3 w-3 text-sky-300" />
      </div>
      <div className="max-w-[85%]">
        <div className="rounded-2xl rounded-bl-sm border border-slate-700/50 bg-slate-800/70 px-3 py-2 text-[12px] leading-relaxed text-slate-100 shadow-lg">
          {content}
        </div>
        {action && <ActionTag action={action} />}
      </div>
    </div>
  );
}

function ActionTag({ action }: { action: AssistantAction }) {
  let label = "";
  switch (action.kind) {
    case "focus": label = "→ camera moved"; break;
    case "highlight": label = "→ highlight applied"; break;
    case "hide": label = "→ hidden"; break;
    case "showAll": label = "→ all shown"; break;
    case "tour": label = `→ tour step ${action.step}`; break;
    case "quiz": label = "→ quiz started"; break;
  }
  return <div className="mt-1 pl-1 text-[10px] font-medium text-sky-400">{label}</div>;
}
