"use client";

import { useEffect, useRef, useState } from "react";
import { Send, MessageSquare, X, Bot, User } from "lucide-react";
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
  const [open, setOpen] = useState(false);
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
        "pointer-events-auto flex flex-col overflow-hidden border border-slate-800/80 bg-slate-950/85 shadow-2xl backdrop-blur transition-all duration-200",
        "rounded-lg",
        open ? "h-[340px] w-[300px]" : "h-9 w-9 rounded-full"
      )}
    >
      {open ? (
        <>
          {/* header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500/15 ring-1 ring-sky-500/30">
                <Bot className="h-2.5 w-2.5 text-sky-300" />
              </div>
              <span className="text-[11px] font-medium text-slate-200">AI Engineer</span>
              <span className="h-1 w-1 rounded-full bg-emerald-400" />
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Collapse"
              className="rounded p-0.5 text-slate-500 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          {/* messages */}
          <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto px-2.5 py-2">
            {messages.length === 0 && (
              <div className="px-1 py-4 text-center">
                <p className="text-[10px] text-slate-500">Ask anything. Try:</p>
                <div className="mt-2 space-y-1">
                  {["Take me through the plant", "Hide all valves", "Quiz me"].map((s) => (
                    <button
                      key={s}
                      onClick={() => onSend(s)}
                      className="block w-full rounded border border-slate-800/60 bg-slate-900/40 px-2 py-1 text-[10px] text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
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
              <div className="flex items-center gap-1.5 px-1 text-[10px] text-slate-500">
                <span className="flex gap-0.5">
                  <span className="h-1 w-1 animate-bounce rounded-full bg-sky-400 [animation-delay:-0.3s]" />
                  <span className="h-1 w-1 animate-bounce rounded-full bg-sky-400 [animation-delay:-0.15s]" />
                  <span className="h-1 w-1 animate-bounce rounded-full bg-sky-400" />
                </span>
                thinking
              </div>
            )}
          </div>

          {/* input */}
          <div className="border-t border-slate-800/80 p-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit(input);
              }}
              className="flex gap-1.5"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask…"
                disabled={busy}
                className="h-7 border-slate-800 bg-slate-900/60 px-2 text-[11px] text-white placeholder:text-slate-600 focus-visible:border-slate-600 focus-visible:ring-slate-700"
              />
              <Button
                type="submit"
                size="icon"
                disabled={busy || !input.trim()}
                className="h-7 w-7 bg-slate-100 hover:bg-white"
              >
                <Send className="h-3 w-3 text-slate-900" />
              </Button>
            </form>
          </div>
        </>
      ) : (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open chat"
          className="flex h-full w-full items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <MessageSquare className="h-4 w-4" />
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
      <div className="flex justify-end gap-1.5">
        <div className="max-w-[80%] rounded-md rounded-br-sm bg-slate-100 px-2 py-1 text-[11px] text-slate-900">
          {content}
        </div>
        <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-800">
          <User className="h-2.5 w-2.5 text-slate-400" />
        </div>
      </div>
    );
  }
  if (role === "system") {
    return (
      <div className="flex justify-center">
        <div className="rounded-full bg-slate-800/60 px-2 py-0.5 text-[9px] text-slate-500">
          {content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start gap-1.5">
      <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-sky-500/15 ring-1 ring-sky-500/30">
        <Bot className="h-2.5 w-2.5 text-sky-300" />
      </div>
      <div className="max-w-[88%]">
        <div className="rounded-md rounded-bl-sm bg-slate-800/80 px-2 py-1 text-[11px] text-slate-100">
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
    case "tour": label = `→ tour ${action.step}`; break;
    case "quiz": label = "→ quiz"; break;
  }
  return <div className="mt-0.5 pl-0.5 text-[9px] text-sky-400">{label}</div>;
}
