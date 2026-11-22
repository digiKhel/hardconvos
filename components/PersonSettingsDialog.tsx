"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { LIMITS } from "@/lib/limits";
import { emptyProfile, newId, type Person, type Profile } from "@/lib/workspace";
import { CloseIcon } from "./icons";

type Props = {
  person: Person;
  onChange: (update: (profile: Profile) => Profile) => void;
  onClose: () => void;
};

type SectionProps = {
  title: string;
  status: string;
  defaultOpen?: boolean;
  onOpen?: () => void;
  children: ReactNode;
};

function Section({ title, status, defaultOpen = false, onOpen, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="section">
      <h3>
        <button
          className="section-head"
          aria-expanded={open}
          onClick={() => {
            setOpen(!open);
            if (!open) onOpen?.();
          }}
        >
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

export function PersonSettingsDialog({ person, onChange, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const newAnecdote = useRef<string | null>(null);
  const inFlight = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!dialog.current?.open) dialog.current?.showModal();
  }, []);

  const profile = person.profile ?? emptyProfile;
  const anecdotes = profile.anecdotes.map((a) => a.text.trim()).filter(Boolean);
  const answered = profile.questions.filter((q) => q.answer.trim());
  const hasNotes = Boolean(profile.context.trim() || anecdotes.length);
  // What the questions were written from, so they can refresh when it changes.
  const basis = JSON.stringify([profile.context.trim(), anecdotes]);

  async function generate() {
    if (inFlight.current || !hasNotes) return;
    inFlight.current = true;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: person.name,
          context: profile.context,
          anecdotes,
          answered: answered.map(({ text, answer }) => ({ question: text, answer })),
        }),
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

  function addAnecdote() {
    const id = newId();
    newAnecdote.current = id;
    onChange((current) => ({ ...current, anecdotes: [...current.anecdotes, { id, text: "" }] }));
  }

  function removeAnecdote(id: string, text: string) {
    if (text.trim() && !confirm("Remove this anecdote?")) return;
    onChange((current) => ({ ...current, anecdotes: current.anecdotes.filter((a) => a.id !== id) }));
  }

  return (
    <dialog ref={dialog} className="settings" onClose={onClose} aria-labelledby="settings-title">
      <header className="settings-head">
        <h2 id="settings-title">About {person.name}</h2>
        <button className="done" onClick={onClose}>Done</button>
      </header>

      <div className="settings-body">
        <Section title="Context" status={profile.context.trim() ? "Added" : "Empty"} defaultOpen>
          <p className="hint">Who they are, how you know them, and how they tend to be.</p>
          <textarea
            className="field context"
            value={profile.context}
            maxLength={LIMITS.context}
            aria-label={`Context about ${person.name}`}
            placeholder="e.g. My mother, 62. Proud and independent. Changes the subject when she's worried."
            onChange={(event) => {
              const context = event.target.value;
              onChange((current) => ({ ...current, context }));
            }}
          />
        </Section>

        <Section title="Anecdotes" status={anecdotes.length ? String(anecdotes.length) : "None yet"}>
          <p className="hint">Past interactions {person.name} has had, with you or with anyone else.</p>
          {profile.anecdotes.map(({ id, text }, index) => (
            <div className="item" key={id}>
              <div className="item-head">
                <label htmlFor={id}>Anecdote {index + 1}</label>
                <button
                  className="remove"
                  onClick={() => removeAnecdote(id, text)}
                  aria-label={`Remove anecdote ${index + 1}`}
                >
                  <CloseIcon />
                </button>
              </div>
              <textarea
                id={id}
                className="field"
                value={text}
                maxLength={LIMITS.anecdote}
                placeholder="What happened, and how did they react?"
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
            + Add anecdote
          </button>
        </Section>

        <Section
          title="How would they respond?"
          status={profile.questions.length ? `${answered.length} of ${profile.questions.length}` : "Auto-generated"}
          onOpen={() => {
            if (basis !== profile.questionsBasis) void generate();
          }}
        >
          <p className="hint">
            {hasNotes
              ? "Written by Claude from your context and anecdotes. Answer any you can."
              : "Add some context or an anecdote, and questions will be written from it."}
          </p>
          <div role="status">
            {loading && <p className="hint">Writing questions about {person.name}…</p>}
          </div>
          {error && <p className="error" role="alert">{error}</p>}
          {profile.questions.map(({ id, text, answer }) => (
            <div className="item" key={id}>
              <label htmlFor={id}>{text}</label>
              <textarea
                id={id}
                className="field"
                value={answer}
                maxLength={LIMITS.answer}
                placeholder={`How would ${person.name} respond?`}
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
          {hasNotes && !loading && (
            <button className="secondary" onClick={generate}>
              {profile.questions.length ? "New questions (keeps your answers)" : "Generate questions"}
            </button>
          )}
        </Section>

        <p className="privacy">
          Saved in this browser as you type. Your notes are sent to Claude when questions are generated.
        </p>
      </div>
    </dialog>
  );
}
