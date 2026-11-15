"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Icon } from "@/components/Icon";
import type { ChatAction } from "@/lib/chat";
import { clearChat } from "./actions";

export type Message = { id: string; role: "user" | "assistant"; content: string; actions: ChatAction[]; created_at: string };

const STARTERS = [
  "I'm about to eat… is that good?",
  "What should I eat right now?",
  "Log what I just ate",
  "I'm feeling down about my skin",
  "Ideas for an easy high-calorie snack",
];

export function Chat({ initial, name }: { initial: Message[]; name: string }) {
  const [messages, setMessages] = useState(initial);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [clearing, startClear] = useTransition();
  const bottom = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [messages.length, sending]);

  async function send(content: string) {
    const message = content.trim();
    if (!message || sending) return;
    setError("");
    setSending(true);
    setText("");
    const pending: Message = { id: `pending-${Date.now()}`, role: "user", content: message, actions: [], created_at: new Date().toISOString() };
    setMessages((m) => [...m, pending]);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Something went wrong.");
      setMessages((m) => [...m.filter((x) => x.id !== pending.id), ...(body.messages as Message[])]);
    } catch (err) {
      setMessages((m) => m.filter((x) => x.id !== pending.id));
      setText(message);
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  function pickStarter(s: string) {
    if (s.includes("…")) {
      setText(s.replace("…", " ").replace(" is that good?", ""));
      input.current?.focus();
    } else {
      send(s);
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-14rem)] flex-col pb-20">
      <div className="mb-3 flex items-center justify-between px-1">
        <h1 className="text-2xl font-extrabold tracking-tight">Chat</h1>
        {messages.length > 0 && (
          <button
            type="button"
            className="text-sm text-muted hover:text-soft"
            disabled={clearing}
            onClick={() => {
              if (confirm("Clear this conversation? Your logs and profile stay as they are.")) {
                startClear(async () => {
                  await clearChat();
                  setMessages([]);
                });
              }
            }}
          >
            Clear chat
          </button>
        )}
      </div>

      {messages.length === 0 && (
        <section className="card space-y-3">
          <span className="icon-tile">
            <Icon name="heart" />
          </span>
          <h2 className="text-[19px] font-bold">Hi{name ? ` ${name}` : ""}, I&apos;m here for you</h2>
          <p className="leading-relaxed text-soft">
            Ask me anything about food, tell me what you&apos;re about to eat, or just tell me how you&apos;re feeling. I can log
            meals, exercise and check-ins for you, and keep your profile up to date.
          </p>
        </section>
      )}

      <ol className="mt-3 flex flex-1 flex-col gap-2.5" aria-live="polite">
        {messages.map((m) => (
          <li key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div className={m.role === "user" ? "max-w-[85%]" : "max-w-[92%] space-y-1.5"}>
              <p
                className={
                  m.role === "user"
                    ? "whitespace-pre-wrap rounded-[18px] rounded-br-md bg-baby px-3.5 py-2.5 text-[15px] leading-relaxed text-app"
                    : "whitespace-pre-wrap rounded-[18px] rounded-bl-md border border-line bg-card px-3.5 py-2.5 text-[15px] leading-relaxed text-fg"
                }
              >
                {m.content}
              </p>
              {m.actions?.map((a, i) => (
                <p key={i} className="flex items-start gap-1.5 px-1 text-[13px] text-blush">
                  <Icon name="check" size={14} strokeWidth={2.4} className="mt-[3px] shrink-0" />
                  {a.label}
                </p>
              ))}
            </div>
          </li>
        ))}
        {sending && (
          <li className="flex justify-start">
            <p className="flex gap-1 rounded-[18px] rounded-bl-md border border-line bg-card px-4 py-3.5" aria-label="Nourish is typing">
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted [animation-delay:-0.3s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted [animation-delay:-0.15s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted" />
            </p>
          </li>
        )}
      </ol>
      <div ref={bottom} />

      {messages.length < 4 && !sending && (
        <div className="mt-4 flex flex-wrap gap-2">
          {STARTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => pickStarter(s)}
              className="min-h-10 rounded-full border border-line px-3.5 text-left text-sm text-soft hover:border-baby hover:text-fg"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(text);
        }}
        className="fixed inset-x-0 bottom-[calc(68px+env(safe-area-inset-bottom))] z-10 border-t border-line-soft bg-app/95 backdrop-blur"
      >
        <div className="mx-auto flex max-w-xl items-end gap-2 px-4 py-2.5">
          <label htmlFor="chat-input" className="sr-only">
            Message
          </label>
          <textarea
            id="chat-input"
            ref={input}
            rows={1}
            maxLength={2000}
            value={text}
            placeholder="Message Nourish…"
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && window.matchMedia("(pointer: fine)").matches) {
                e.preventDefault();
                send(text);
              }
            }}
            className="input max-h-32 min-h-12 resize-none py-3 [field-sizing:content]"
          />
          <button
            type="submit"
            aria-label="Send"
            disabled={!text.trim() || sending}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-baby text-app disabled:opacity-40"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
