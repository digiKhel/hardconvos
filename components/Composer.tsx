"use client";

import { useLayoutEffect, useRef } from "react";
import { LIMITS } from "@/lib/limits";
import { SendIcon, SettingsIcon } from "./icons";

type Props = {
  recipient: string;
  value: string;
  /** True while the other person is replying: typing is fine, sending waits. */
  busy: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
  onSettings: () => void;
};

export function Composer({ recipient, value, busy, onChange, onSend, onSettings }: Props) {
  const input = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = input.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`;
  }, [value]);

  return (
    <form
      className="composer"
      onSubmit={(event) => {
        event.preventDefault();
        onSend();
        input.current?.focus();
      }}
    >
      <button type="button" className="pill icon" onClick={onSettings} aria-label="Settings for this chat">
        <SettingsIcon />
      </button>
      <textarea
        ref={input}
        rows={1}
        value={value}
        maxLength={LIMITS.message}
        placeholder={`Message ${recipient}`}
        aria-label={`Message ${recipient}`}
        enterKeyHint="enter"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          // Enter sends with a physical keyboard; on touch screens it adds a line.
          if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
          if (matchMedia("(pointer: coarse)").matches) return;
          event.preventDefault();
          onSend();
        }}
      />
      <button className="send" type="submit" disabled={busy || !value.trim()} aria-label="Send">
        <SendIcon />
      </button>
    </form>
  );
}
