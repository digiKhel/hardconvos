"use client";

import { useLayoutEffect, useRef } from "react";
import type { Message } from "@/lib/workspace";

const time = (timestamp: number) =>
  new Date(timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

export function Thread({ messages }: { messages: Message[] }) {
  const thread = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);

  useLayoutEffect(() => {
    const el = thread.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    atBottom.current = true;
  }, [messages]);

  // The thread shrinks when the keyboard opens or the composer grows: keep the newest message in view.
  useLayoutEffect(() => {
    const el = thread.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      if (atBottom.current) el.scrollTop = el.scrollHeight;
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="thread"
      ref={thread}
      role="log"
      aria-label="Conversation"
      onScroll={(event) => {
        const el = event.currentTarget;
        atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
      }}
    >
      {messages.length === 0 && <p className="empty">No messages yet. Say the first thing.</p>}
      {messages.map((message) => (
        <div key={message.id} className={`message ${message.from}`}>
          <p className="bubble">{message.text}</p>
          <time>{time(message.sentAt)}</time>
        </div>
      ))}
    </div>
  );
}
