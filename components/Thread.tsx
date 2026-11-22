"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { reviewableIds, type Feedback, type Message } from "@/lib/workspace";
import { Indicator, ReviewPanel } from "./MessageFeedback";

type Props = {
  name: string;
  messages: Message[];
  typing: boolean;
  error?: string;
  onRetry: () => void;
  feedback?: Feedback;
  reviewing: boolean;
  feedbackError?: string;
  onFeedback: () => void;
};

const time = (timestamp: number) =>
  new Date(timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

/** Oldest first, so the latest bubble sits right above the composer. */
export function Thread({
  name,
  messages,
  typing,
  error,
  onRetry,
  feedback,
  reviewing,
  feedbackError,
  onFeedback,
}: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const reviewable = reviewableIds(messages);
  const thread = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);
  // Also covers a reload that interrupted a reply.
  const unanswered = !typing && messages.at(-1)?.from === "me";

  const openReview = openId ? feedback?.reviews[openId] : undefined;

  useLayoutEffect(() => {
    const el = thread.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    atBottom.current = true;
  }, [messages, typing, error]);

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

  // A panel opens below its message, which is often the bottom edge of the thread.
  useLayoutEffect(() => {
    if (openId) document.getElementById(`review-${openId}`)?.scrollIntoView({ block: "nearest" });
  }, [openId, openReview]);

  function toggleReview(id: string) {
    const opening = openId !== id;
    setOpenId(opening ? id : null);
    if (opening && !feedback?.reviews[id]) onFeedback();
  }

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
      {messages.map((message) =>
        message.from === "note" ? (
          <p key={message.id} className="note">
            <strong>Rehearsal paused</strong>
            {message.text}
          </p>
        ) : (
          <div
            key={message.id}
            className={`message ${message.from}${openId === message.id ? " open" : ""}`}
          >
            {message.cue && <em className="cue">{message.cue}</em>}
            <div className="said">
              {reviewable.has(message.id) && (
                <Indicator
                  review={feedback?.reviews[message.id]}
                  open={openId === message.id}
                  busy={reviewing}
                  panelId={`review-${message.id}`}
                  onClick={() => toggleReview(message.id)}
                />
              )}
              <p className="bubble">{message.text}</p>
            </div>
            <time>{time(message.sentAt)}</time>
            {openId === message.id && (
              <ReviewPanel
                id={`review-${message.id}`}
                review={feedback?.reviews[message.id]}
                busy={reviewing}
                error={feedbackError}
                onRetry={onFeedback}
              />
            )}
          </div>
        ),
      )}
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
    </div>
  );
}
