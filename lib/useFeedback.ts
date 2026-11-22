"use client";

import { useRef, useState, type Dispatch, type SetStateAction } from "react";
import { LIMITS } from "./limits";
import {
  profileNotes,
  saveFeedback,
  type Chat,
  type Feedback,
  type Person,
  type Profile,
  type Workspace,
} from "./workspace";

/** Fetches coaching on a chat. The button and every indicator share one request per chat. */
export function useFeedback(setWorkspace: Dispatch<SetStateAction<Workspace>>) {
  const inFlight = useRef(new Set<string>());
  const [reviewing, setReviewing] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function requestFeedback(person: Person, chat: Chat, self: Profile | undefined) {
    if (inFlight.current.has(chat.id)) return;
    inFlight.current.add(chat.id);
    setReviewing((r) => ({ ...r, [chat.id]: true }));
    setErrors((e) => ({ ...e, [chat.id]: "" }));
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: person.name,
          person: profileNotes(person.profile),
          chat: profileNotes(chat.profile),
          self: profileNotes(self),
          messages: chat.messages.slice(-LIMITS.history).map(({ id, from, text, cue }) => ({ id, from, text, cue })),
        }),
      }).catch(() => {
        throw new Error("You seem to be offline. Try again.");
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error);
      setWorkspace((w) => saveFeedback(w, person.id, chat.id, body as Feedback));
    } catch (cause) {
      const message = (cause instanceof Error && cause.message) || "Couldn't get feedback. Try again.";
      setErrors((e) => ({ ...e, [chat.id]: message }));
    } finally {
      inFlight.current.delete(chat.id);
      setReviewing((r) => ({ ...r, [chat.id]: false }));
    }
  }

  return { reviewing, feedbackErrors: errors, requestFeedback };
}
