"use client";

import { useLayoutEffect, useRef } from "react";
import type { Message } from "@/lib/workspace";

type Props = {
  name: string;
  messages: Message[];
  typing: boolean;
  error?: string;
  onRetry: () => void;
};

const time = (timestamp: number) =>
  new Date(timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

/** Newest first, so the latest bubble sits right under the composer. */
export function Thread({ name, messages, typing, error, onRetry }: Props) {
  const thread = useRef<HTMLDivElement>(null);
  // Also covers a reload that interrupted a reply.
  const unanswered = !typing && messages.at(-1)?.from === "me";

  useLayoutEffect(() => {
    if (thread.current) thread.current.scrollTop = 0;
  }, [messages, typing, error]);

  return (
    <div className="thread" ref={thread} role="log" aria-label="Conversation, newest first">
      {messages.length === 0 && <p className="empty">No messages yet. Say the first thing.</p>}
      {typing && (
        <div className="message them">
          <p className="bubble typing" role="status" aria-label={`${name} is typing`}>
            <span />
            <span />
            <span />
          </p>
        </div>
      )}
      {unanswered && (
        <div className="unanswered">
          {error && <p className="error" role="alert">{error}</p>}
          <button className="retry" onClick={onRetry}>
            {error ? "Try again" : `Get ${name}'s reply`}
          </button>
        </div>
      )}
      {[...messages].reverse().map((message) =>
        message.from === "note" ? (
          <p key={message.id} className="note">
            <strong>Rehearsal paused</strong>
            {message.text}
          </p>
        ) : (
          <div key={message.id} className={`message ${message.from}`}>
            {message.cue && <em className="cue">{message.cue}</em>}
            <p className="bubble">{message.text}</p>
            <time>{time(message.sentAt)}</time>
          </div>
        ),
      )}
    </div>
  );
}
