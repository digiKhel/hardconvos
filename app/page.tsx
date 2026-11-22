"use client";

import { useState } from "react";
import { AddPersonDialog } from "@/components/AddPersonDialog";
import { ChatPills } from "@/components/ChatPills";
import { Composer } from "@/components/Composer";
import { PeopleRow } from "@/components/PeopleRow";
import { Thread } from "@/components/Thread";
import { useWorkspace } from "@/lib/useWorkspace";
import { addChat, addMessage, addPerson, selectChat } from "@/lib/workspace";

export default function Home() {
  const { workspace, setWorkspace, ready } = useWorkspace();
  const [adding, setAdding] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  if (!ready) return <main className="app" />;

  const person = workspace.people.find((p) => p.id === workspace.selectedPersonId);
  const chat = person?.chats.find((c) => c.id === person.selectedChatId);

  function send() {
    if (!person || !chat) return;
    const text = drafts[chat.id]?.trim();
    if (!text) return;
    setWorkspace((w) => addMessage(w, person.id, chat.id, "me", text));
    setDrafts((d) => ({ ...d, [chat.id]: "" }));
  }

  return (
    <main className="app">
      <PeopleRow
        people={workspace.people}
        selectedId={workspace.selectedPersonId}
        onSelect={(id) => setWorkspace((w) => ({ ...w, selectedPersonId: id }))}
        onAdd={() => setAdding(true)}
      />
      <ChatPills
        person={person}
        onSelect={(id) => person && setWorkspace((w) => selectChat(w, person.id, id))}
        onAdd={() => person && setWorkspace((w) => addChat(w, person.id))}
      />

      {person && chat ? (
        <section className="conversation" key={chat.id}>
          <Composer
            recipient={person.name}
            value={drafts[chat.id] ?? ""}
            onChange={(text) => setDrafts((d) => ({ ...d, [chat.id]: text }))}
            onSend={send}
          />
          <Thread messages={chat.messages} />
        </section>
      ) : (
        <p className="empty">
          {person ? `Tap + to start a conversation with ${person.name}.` : "Add a person to chat with."}
        </p>
      )}

      {adding && (
        <AddPersonDialog
          onAdd={(name) => setWorkspace((w) => addPerson(w, name))}
          onClose={() => setAdding(false)}
        />
      )}
    </main>
  );
}
