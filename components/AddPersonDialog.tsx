"use client";

import { useEffect, useRef, useState } from "react";
import { importPerson } from "@/lib/transfer";
import type { Person } from "@/lib/workspace";

type Props = {
  onAdd: (name: string) => void;
  onImport: (person: Omit<Person, "hue">) => void;
  onClose: () => void;
};

export function AddPersonDialog({ onAdd, onImport, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [pasted, setPasted] = useState("");
  const [error, setError] = useState("");

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

      <form
        className="import"
        onSubmit={(event) => {
          event.preventDefault();
          const person = importPerson(pasted);
          if (!person) {
            setError("That isn't a complete export. Copy it again with Export context.");
            return;
          }
          onImport(person);
          onClose();
        }}
      >
        <label htmlFor="import-text">Or paste an exported context</label>
        <textarea
          id="import-text"
          className="field"
          value={pasted}
          onChange={(event) => {
            setPasted(event.target.value);
            setError("");
          }}
        />
        {error && <p className="error" role="alert">{error}</p>}
        <div className="actions">
          <button type="submit" className="primary" disabled={!pasted.trim()}>Import</button>
        </div>
      </form>
    </dialog>
  );
}
