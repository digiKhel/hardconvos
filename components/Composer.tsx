"use client";

import { useLayoutEffect, useRef } from "react";
import { SendIcon } from "./icons";

type Props = {
  recipient: string;
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
};

export function Composer({ recipient, value, onChange, onSend }: Props) {
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
      <textarea
        ref={input}
        rows={1}
        value={value}
        maxLength={2000}
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
      <button className="send" type="submit" disabled={!value.trim()} aria-label="Send">
        <SendIcon />
      </button>
    </form>
  );
}
