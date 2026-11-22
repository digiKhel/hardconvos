"use client";

import { useRef, useState, type Dispatch, type SetStateAction } from "react";
import { addMessage, profileNotes, type Chat, type NewMessage, type Person, type Profile, type Workspace } from "./workspace";

/** Fetches in-character replies, tracked per chat so switching chats is safe while one is on its way. */
export function useReplies(setWorkspace: Dispatch<SetStateAction<Workspace>>) {
  const inFlight = useRef(new Set<string>());
  const [typing, setTyping] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function requestReply(person: Person, chat: Chat, self: Profile | undefined, messages: NewMessage[]) {
    const chatId = chat.id;
    if (inFlight.current.has(chatId)) return;
    inFlight.current.add(chatId);
    setTyping((t) => ({ ...t, [chatId]: true }));
    setErrors((e) => ({ ...e, [chatId]: "" }));
    try {
      const response = await fetch("/api/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: person.name,
          person: profileNotes(person.profile),
          chat: profileNotes(chat.profile),
          self: profileNotes(self),
          messages: messages.map(({ from, text, cue }) => ({ from, text, cue })),
        }),
      }).catch(() => {
        throw new Error("You seem to be offline. Try again.");
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error);
      setWorkspace((w) => addMessage(w, person.id, chatId, { from: body.from, text: body.text, cue: body.cue }));
    } catch (cause) {
      const message = (cause instanceof Error && cause.message) || "Couldn't get a reply. Try again.";
      setErrors((e) => ({ ...e, [chatId]: message }));
    } finally {
      inFlight.current.delete(chatId);
      setTyping((t) => ({ ...t, [chatId]: false }));
    }
  }

  return { typing, errors, requestReply };
}
