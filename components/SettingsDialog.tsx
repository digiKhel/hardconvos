"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { LIMITS } from "@/lib/limits";
import { newId, profileNotes, type Profile, type SettingsKind } from "@/lib/workspace";
import { CloseIcon } from "./icons";

const copyFor = (kind: SettingsKind, name: string) =>
  ({
    person: {
      title: `About ${name}`,
      context: {
        title: "Context",
        hint: "Who they are, how you know them, and how they tend to be.",
        placeholder: "e.g. My mother, 62. Proud and independent. Changes the subject when she's worried.",
      },
      anecdotes: {
        title: "Anecdotes",
        item: "Anecdote",
        hint: `Past interactions ${name} has had, with you or with anyone else.`,
        placeholder: "What happened, and how did they react?",
      },
      questions: {
        title: "How would they respond?",
        hint: "Claude asks how they'd respond in different scenarios.",
        focus: "e.g. How they handle being told what to do",
        answer: `How would ${name} respond?`,
      },
    },
    self: {
      title: "About me",
      context: {
        title: "Context",
        hint: "Who you are, and how you tend to be in hard conversations.",
        placeholder: "e.g. The eldest child. I avoid conflict, then say too much at once.",
      },
      anecdotes: {
        title: "Anecdotes",
        item: "Anecdote",
        hint: "Moments that show what you're like.",
        placeholder: "What happened, and how did you react?",
      },
      questions: {
        title: "How do I respond and feel?",
        hint: "Claude asks how you respond and feel in different conversations.",
        focus: "e.g. What happens when I feel blamed",
        answer: "What do you do, and how do you feel?",
      },
    },
    chat: {
      title: `This chat with ${name}`,
      context: {
        title: "What it's about",
        hint: "What do you want to have a chat about?",
        placeholder: "e.g. I want to ask her to see a doctor about her knee.",
      },
      anecdotes: {
        title: "Recent interactions",
        item: "Interaction",
        hint: `Any recent engagements between you and ${name}.`,
        placeholder: "When was it, and what happened between you?",
      },
      questions: {
        title: "How did it go?",
        hint: "Claude asks how you two left things: the responses given and the emotions shown.",
        focus: "e.g. Whether they were angry or hurt",
        answer: "How did they respond? What did you both feel?",
      },
    },
  })[kind];

type Props = {
  kind: SettingsKind;
  /** The other person's name. Empty for the self persona. */
  name: string;
  profile: Profile;
  /** The other person's profile, which helps shape questions about a chat. */
  personProfile?: Profile;
  /** Shown above the sections. */
  toolbar?: ReactNode;
  onChange: (update: (profile: Profile) => Profile) => void;
  onClose: () => void;
};

type SectionProps = {
  title: string;
  status: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

function Section({ title, status, defaultOpen = false, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="section">
      <h3>
        <button className="section-head" aria-expanded={open} onClick={() => setOpen(!open)}>
          <span>{title}</span>
          <small>{status}</small>
          <span className="chevron" aria-hidden />
        </button>
      </h3>
      <div className="section-body" hidden={!open}>
        {children}
      </div>
    </section>
  );
}

export function SettingsDialog({ kind, name, profile, personProfile, toolbar, onChange, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const newAnecdote = useRef<string | null>(null);
  const inFlight = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!dialog.current?.open) dialog.current?.showModal();
  }, []);

  const copy = copyFor(kind, name);
  const notes = profileNotes(profile);
  const focus = profile.focus?.trim() ?? "";
  const hasNotes = Boolean(notes.context || notes.location || notes.anecdotes.length);
  const canGenerate = hasNotes || Boolean(focus);
  // What the questions were written from, to say when they are out of date.
  const basis = JSON.stringify([notes.context, notes.location, notes.anecdotes, focus]);
  const outOfDate = profile.questions.length > 0 && !!profile.questionsBasis && basis !== profile.questionsBasis;

  async function generate() {
    if (inFlight.current || !canGenerate) return;
    inFlight.current = true;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, name, focus, profile: notes, person: profileNotes(personProfile) }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error);
      const fresh = (body.questions as string[]).map((text) => ({ id: newId(), text, answer: "" }));
      // Read answers at this point, so anything typed while waiting is kept.
      onChange((current) => ({
        ...current,
        questionsBasis: basis,
        questions: [...current.questions.filter((q) => q.answer.trim()), ...fresh],
      }));
    } catch (cause) {
      setError((cause instanceof Error && cause.message) || "Couldn't write questions. Try again.");
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }

  function set(field: "context" | "location" | "focus", value: string) {
    onChange((current) => ({ ...current, [field]: value }));
  }

  function addAnecdote() {
    const id = newId();
    newAnecdote.current = id;
    onChange((current) => ({ ...current, anecdotes: [...current.anecdotes, { id, text: "" }] }));
  }

  function removeAnecdote(id: string, text: string) {
    if (text.trim() && !confirm(`Remove this ${copy.anecdotes.item.toLowerCase()}?`)) return;
    onChange((current) => ({ ...current, anecdotes: current.anecdotes.filter((a) => a.id !== id) }));
  }

  return (
    <dialog ref={dialog} className="settings" onClose={onClose} aria-labelledby="settings-title">
      <header className="settings-head">
        <h2 id="settings-title">{copy.title}</h2>
        <button className="done" onClick={onClose}>Done</button>
      </header>

      <div className="settings-body">
        {toolbar}
        <Section title={copy.context.title} status={notes.context || notes.location ? "Added" : "Empty"} defaultOpen>
          <p className="hint">{copy.context.hint}</p>
          <textarea
            className="field context"
            value={profile.context}
            maxLength={LIMITS.context}
            aria-label={copy.context.hint}
            placeholder={copy.context.placeholder}
            onChange={(event) => set("context", event.target.value)}
          />
          {kind === "chat" && (
            <div className="item location">
              <label htmlFor="location">Where will it happen?</label>
              <input
                id="location"
                className="field line"
                value={profile.location ?? ""}
                maxLength={LIMITS.location}
                placeholder="e.g. Her kitchen after dinner, or on a call"
                onChange={(event) => set("location", event.target.value)}
              />
            </div>
          )}
        </Section>

        <Section title={copy.anecdotes.title} status={notes.anecdotes.length ? String(notes.anecdotes.length) : "None yet"}>
          <p className="hint">{copy.anecdotes.hint}</p>
          {profile.anecdotes.map(({ id, text }, index) => (
            <div className="item" key={id}>
              <div className="item-head">
                <label htmlFor={id}>{copy.anecdotes.item} {index + 1}</label>
                <button
                  className="remove"
                  onClick={() => removeAnecdote(id, text)}
                  aria-label={`Remove ${copy.anecdotes.item.toLowerCase()} ${index + 1}`}
                >
                  <CloseIcon />
                </button>
              </div>
              <textarea
                id={id}
                className="field"
                value={text}
                maxLength={LIMITS.anecdote}
                placeholder={copy.anecdotes.placeholder}
                ref={(el) => {
                  if (!el || newAnecdote.current !== id) return;
                  newAnecdote.current = null;
                  el.focus();
                }}
                onChange={(event) => {
                  const value = event.target.value;
                  onChange((current) => ({
                    ...current,
                    anecdotes: current.anecdotes.map((a) => (a.id === id ? { ...a, text: value } : a)),
                  }));
                }}
              />
            </div>
          ))}
          <button className="secondary" onClick={addAnecdote} disabled={profile.anecdotes.length >= LIMITS.anecdotes}>
            + Add {copy.anecdotes.item.toLowerCase()}
          </button>
        </Section>

        <Section
          title={copy.questions.title}
          status={profile.questions.length ? `${notes.answered.length} of ${profile.questions.length}` : "Auto-generated"}
        >
          <p className="hint">{copy.questions.hint}</p>
          <div className="focus">
            <label htmlFor="focus">What should the questions prod you on? (optional)</label>
            <textarea
              id="focus"
              className="field"
              value={profile.focus ?? ""}
              maxLength={LIMITS.focus}
              placeholder={copy.questions.focus}
              onChange={(event) => set("focus", event.target.value)}
            />
            <button className="secondary" onClick={generate} disabled={loading || !canGenerate}>
              {loading
                ? "Writing questions…"
                : profile.questions.length
                  ? "New questions (keeps your answers)"
                  : "Generate questions"}
            </button>
            <div role="status">
              {!canGenerate && <p className="hint">Add some notes above, or say what to ask about.</p>}
              {outOfDate && !loading && <p className="hint">You've changed your notes since these were written.</p>}
            </div>
            {error && <p className="error" role="alert">{error}</p>}
          </div>
          {profile.questions.map(({ id, text, answer }) => (
            <div className="item" key={id}>
              <label htmlFor={id}>{text}</label>
              <textarea
                id={id}
                className="field"
                value={answer}
                maxLength={LIMITS.answer}
                placeholder={copy.questions.answer}
                onChange={(event) => {
                  const value = event.target.value;
                  onChange((current) => ({
                    ...current,
                    questions: current.questions.map((q) => (q.id === id ? { ...q, answer: value } : q)),
                  }));
                }}
              />
            </div>
          ))}
        </Section>

        <p className="privacy">
          Saved in this browser as you type. Your notes and chats are sent to Claude to write questions and replies.
        </p>
      </div>
    </dialog>
  );
}
