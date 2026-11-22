"use client";

import { useEffect, useRef, useState } from "react";
import { exportPerson } from "@/lib/transfer";
import type { Person } from "@/lib/workspace";

export function ExportContext({ person }: { person: Person }) {
  const [includeChats, setIncludeChats] = useState(false);
  const [status, setStatus] = useState("");
  // Filled only when the clipboard is unavailable, so the text can be copied by hand.
  const [manual, setManual] = useState("");
  const manualBox = useRef<HTMLTextAreaElement>(null);
  const count = person.chats.length;

  useEffect(() => {
    if (!manual) return;
    manualBox.current?.focus();
    manualBox.current?.select();
  }, [manual]);

  async function copy() {
    const text = exportPerson(person, includeChats);
    try {
      await navigator.clipboard.writeText(text);
      setManual("");
      setStatus(`Copied${includeChats ? " with chats" : ""}. To load it, tap Add, then paste it there.`);
    } catch {
      setManual(text);
      setStatus("Couldn't use the clipboard. Copy the text below.");
    }
  }

  return (
    <div className="export">
      <button className="secondary" onClick={copy}>Export context</button>
      <label className="tick">
        <input
          type="checkbox"
          checked={includeChats}
          onChange={(event) => {
            setIncludeChats(event.target.checked);
            setStatus("");
            setManual("");
          }}
        />
        Include chats ({count})
      </label>
      <p className="hint" role="status">{status}</p>
      {manual && (
        <textarea
          className="field"
          readOnly
          value={manual}
          aria-label="Exported context"
          ref={manualBox}
          onFocus={(event) => event.target.select()}
        />
      )}
    </div>
  );
}
