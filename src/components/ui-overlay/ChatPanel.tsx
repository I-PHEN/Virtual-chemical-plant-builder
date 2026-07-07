"use client";

import { useEffect, useRef, useState } from "react";
import { Send, MessageSquare, X, Sparkles, Bot, User } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { AssistantAction } from "@/lib/plant/types";

interface ChatPanelProps {
  onSend: (text: string) => void;
  busy: boolean;
}

export function ChatPanel({ onSend, busy }: ChatPanelProps) {
  const messages = useAppStore((s) => s.messages);
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const submit = (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    onSend(t);
    setInput("");
  };

  return (
    <div
      className={cn(
        "pointer-events-auto flex flex-col overflow-hidden border border-slate-700/50 bg-slate-900/80 shadow-2xl backdrop-blur-xl transition-all duration-300",
        "rounded-2xl ring-1 ring-white/5",
        open ? "h-[440px] w-[360px]" : "h-[52px] w-[52px] rounded-full"
      )}
    >
      {open ? (
        <>
          {/* header */}
          <div className="flex items-center justify-between border-b border-slate-700/40 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/20 to-violet-500/20 ring-1 ring-sky-400/30">
                <Bot className="h-4 w-4 text-sky-300" />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">AI Process Engineer</div>
                <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                  <span className="h-1 w-1 rounded-full bg-emerald-400" />
                  online · ready to teach
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Collapse chat"
              className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {messages.length === 0 && (
              <div className="px-2 py-8 text-center">
                <Sparkles className="mx-auto mb-3 h-6 w-6 text-sky-400/60" />
                <p className="text-xs text-slate-400">Ask me anything about the plant. Try:</p>
                <div className="mt-3 space-y-1.5">
                  {[
                    "Take me through the plant",
                    "Why is this pump here?",
                    "Hide all valves",
                    "Quiz me",
                  ].map((s) => (
                    <button
                      key={s}
                      onClick={() => onSend(s)}
                      className="block w-full rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-sky-500/40 hover:bg-slate-800 hover:text-white"
                    >
                      “{s}”
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m) => (
              <MessageBubble key={m.id} role={m.role} content={m.content} action={m.action} />
            ))}
            {busy && (
              <div className="flex items-center gap-2 px-2 text-xs text-slate-400">
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sky-400 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sky-400 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sky-400" />
                </span>
                AI is thinking…
              </div>
            )}
          </div>

          {/* input */}
          <div className="border-t border-slate-700/40 p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit(input);
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask the engineer…"
                disabled={busy}
                className="border-slate-700/60 bg-slate-800/60 text-white placeholder:text-slate-500 focus-visible:border-sky-500 focus-visible:ring-sky-500/30"
              />
              <Button
                type="submit"
                size="icon"
                disabled={busy || !input.trim()}
                className="bg-gradient-to-br from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </>
      ) : (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open chat"
          className="flex h-full w-full items-center justify-center rounded-full text-sky-300 transition-colors hover:bg-slate-800"
        >
          <MessageSquare className="h-5 w-5" />
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
        <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-gradient-to-br from-sky-500 to-cyan-500 px-3.5 py-2 text-sm text-white shadow-lg shadow-sky-500/20">
          {content}
        </div>
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-800 ring-1 ring-slate-700">
          <User className="h-3.5 w-3.5 text-slate-300" />
        </div>
      </div>
    );
  }
  if (role === "system") {
    return (
      <div className="flex justify-center">
        <div className="rounded-full bg-slate-800/60 px-3 py-1 text-[10px] text-slate-400">
          {content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start gap-2">
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/20 to-violet-500/20 ring-1 ring-sky-400/30">
        <Bot className="h-3.5 w-3.5 text-sky-300" />
      </div>
      <div className="max-w-[88%]">
        <div className="rounded-2xl rounded-bl-sm bg-slate-800/80 px-3.5 py-2 text-sm text-slate-100 shadow-lg ring-1 ring-white/5">
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
    case "focus":
      label = "→ camera moved";
      break;
    case "highlight":
      label = "→ highlight applied";
      break;
    case "hide":
      label = "→ equipment hidden";
      break;
    case "showAll":
      label = "→ all shown";
      break;
    case "tour":
      label = `→ tour step ${action.step}`;
      break;
    case "quiz":
      label = "→ quiz started";
      break;
  }
  return <div className="mt-1 pl-1 text-[10px] font-medium text-sky-400">{label}</div>;
}
