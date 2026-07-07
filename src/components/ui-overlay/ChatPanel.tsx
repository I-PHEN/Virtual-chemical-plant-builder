"use client";

import { useEffect, useRef, useState } from "react";
import { Send, MessageSquare, X, Sparkles } from "lucide-react";
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
        "pointer-events-auto flex flex-col overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/85 backdrop-blur-md shadow-2xl transition-all duration-300",
        open ? "w-[360px] h-[440px]" : "w-[52px] h-[52px]"
      )}
    >
      {open ? (
        <>
          {/* header */}
          <div className="flex items-center justify-between border-b border-slate-700/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-500/20 text-sky-300">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">AI Process Engineer</div>
                <div className="text-[10px] text-slate-400">always ready to teach</div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Collapse chat"
              className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {messages.length === 0 && (
              <div className="px-2 py-6 text-center text-xs text-slate-400">
                Ask me anything about the plant. Try:
                <div className="mt-2 space-y-1">
                  <em className="block text-slate-300">"Take me through the plant"</em>
                  <em className="block text-slate-300">"Why is this pump here?"</em>
                  <em className="block text-slate-300">"Hide all valves"</em>
                  <em className="block text-slate-300">"Quiz me"</em>
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
          <div className="border-t border-slate-700/60 p-3">
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
                className="border-slate-600 bg-slate-800/60 text-white placeholder:text-slate-500 focus-visible:ring-sky-500"
              />
              <Button
                type="submit"
                size="icon"
                disabled={busy || !input.trim()}
                className="bg-sky-500 hover:bg-sky-400"
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
          className="flex h-full w-full items-center justify-center text-sky-300 hover:bg-slate-800"
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
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-sky-500 px-3 py-2 text-sm text-white shadow">
          {content}
        </div>
      </div>
    );
  }
  if (role === "system") {
    return (
      <div className="flex justify-center">
        <div className="rounded-full bg-slate-800 px-3 py-1 text-[10px] text-slate-400">
          {content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start">
      <div className="max-w-[88%]">
        <div className="rounded-2xl rounded-bl-sm bg-slate-800 px-3 py-2 text-sm text-slate-100 shadow">
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
  return <div className="mt-1 pl-1 text-[10px] text-sky-400">{label}</div>;
}
