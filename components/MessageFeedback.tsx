import type { MessageReview, Verdict } from "@/lib/workspace";

const LOOKS: Record<Verdict, { mark: string; label: string }> = {
  landed: { mark: "✓", label: "Landed well" },
  mixed: { mark: "~", label: "Could be better" },
  harsh: { mark: "!", label: "Might have sounded harsh" },
};

type IndicatorProps = {
  review?: MessageReview;
  open: boolean;
  busy: boolean;
  panelId: string;
  onClick: () => void;
};

/** The small mark beside one of the user's messages. */
export function Indicator({ review, open, busy, panelId, onClick }: IndicatorProps) {
  const look = review && LOOKS[review.verdict];
  return (
    <button
      className="indicator"
      onClick={onClick}
      aria-expanded={open}
      aria-controls={open ? panelId : undefined}
      aria-label={look ? `Feedback: ${look.label}` : "Get feedback on this message"}
    >
      <span className={`mark ${review?.verdict ?? ""}`}>{look?.mark ?? (busy ? "…" : "?")}</span>
    </button>
  );
}

type PanelProps = {
  id: string;
  review?: MessageReview;
  busy: boolean;
  error?: string;
  onRetry: () => void;
};

export function ReviewPanel({ id, review, busy, error, onRetry }: PanelProps) {
  return (
    <div className="review" id={id}>
      {review ? (
        <>
          <strong>{LOOKS[review.verdict].label}</strong>
          <p>{review.what}</p>
          {review.differently && (
            <>
              <h4>What you could have done differently</h4>
              <p>{review.differently}</p>
            </>
          )}
          {review.say && (
            <>
              <h4>You could have said</h4>
              <p className="say">{review.say}</p>
            </>
          )}
        </>
      ) : busy ? (
        <p role="status">Looking at what you said…</p>
      ) : (
        <>
          <p className={error ? "error" : ""}>{error || "No feedback on this message yet."}</p>
          <button className="retry" onClick={onRetry}>{error ? "Try again" : "Get feedback"}</button>
        </>
      )}
    </div>
  );
}
