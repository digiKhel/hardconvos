"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  onAdd: (name: string) => void;
  onClose: () => void;
};

export function AddPersonDialog({ onAdd, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");

  useEffect(() => {
    if (!dialog.current?.open) dialog.current?.showModal();
    input.current?.focus();
  }, []);

  return (
    <dialog ref={dialog} className="dialog" onClose={onClose} aria-labelledby="add-person-title">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim()) return;
          onAdd(name.trim());
          onClose();
        }}
      >
        <h2 id="add-person-title">Who do you want to talk to?</h2>
        <input
          ref={input}
          value={name}
          maxLength={40}
          onChange={(event) => setName(event.target.value)}
          placeholder="Name, e.g. Amma"
          aria-label="Name"
          autoComplete="off"
        />
        <div className="actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit" className="primary" disabled={!name.trim()}>Add</button>
        </div>
      </form>
    </dialog>
  );
}
