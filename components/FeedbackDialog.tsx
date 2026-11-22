"use client";

import { useEffect, useRef } from "react";
import type { Feedback } from "@/lib/workspace";

type Props = {
  name: string;
  feedback?: Feedback;
  /** There are messages newer than the feedback. */
  outOfDate: boolean;
  busy: boolean;
  error?: string;
  onRefresh: () => void;
  onClose: () => void;
};

function Points({ title, points }: { title: string; points: string[] }) {
  if (!points.length) return null;
  return (
    <section className="section points">
      <h3>{title}</h3>
      <ul>
        {points.map((point, index) => (
          <li key={index}>{point}</li>
        ))}
      </ul>
    </section>
  );
}

export function FeedbackDialog({ name, feedback, outOfDate, busy, error, onRefresh, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!dialog.current?.open) dialog.current?.showModal();
  }, []);

  return (
    <dialog ref={dialog} className="settings" onClose={onClose} aria-labelledby="feedback-title">
      <header className="settings-head">
        <h2 id="feedback-title">How it&apos;s going with {name}</h2>
        <button className="done" onClick={onClose}>Done</button>
      </header>

      <div className="settings-body">
        <div role="status">
          {busy && <p className="hint">Reading the conversation so far…</p>}
          {!busy && !error && feedback && outOfDate && (
            <p className="hint">There are new messages since this feedback.</p>
          )}
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        {!busy && (error || outOfDate) && (
          <button className="secondary refresh" onClick={onRefresh}>
            {error ? "Try again" : "Get new feedback"}
          </button>
        )}

        {feedback &&
          (feedback.safety ? (
            <p className="note">
              <strong>Pausing the feedback</strong>
              {feedback.safety}
            </p>
          ) : (
            <div className={busy ? "stale" : ""}>
              <section className="section points">
                <h3>How it&apos;s going so far</h3>
                <p>{feedback.overall}</p>
              </section>
              <Points title="What landed well" points={feedback.landed} />
              <Points title="What you could have done differently" points={feedback.differently} />
              <p className="privacy">Close this and tap the mark beside any of your messages for feedback on it.</p>
            </div>
          ))}
      </div>
    </dialog>
  );
}
