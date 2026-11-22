"use client";

import { useState } from "react";
import { AddPersonDialog } from "@/components/AddPersonDialog";
import { ChatPills } from "@/components/ChatPills";
import { Composer } from "@/components/Composer";
import { ExportContext } from "@/components/ExportContext";
import { PeopleRow } from "@/components/PeopleRow";
import { SettingsDialog } from "@/components/SettingsDialog";
import { Thread } from "@/components/Thread";
import { useReplies } from "@/lib/useReplies";
import { useWorkspace } from "@/lib/useWorkspace";
import {
  addChat,
  addImportedPerson,
  addMessage,
  addPerson,
  emptyProfile,
  selectChat,
  updateChatProfile,
  updateProfile,
  updateSelf,
  type NewMessage,
  type SettingsKind,
} from "@/lib/workspace";

export default function Home() {
  const { workspace, setWorkspace, ready } = useWorkspace();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<SettingsKind | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const { typing, errors, requestReply } = useReplies(setWorkspace);

  if (!ready) return <main className="app" />;

  const { self } = workspace;
  const person = workspace.people.find((p) => p.id === workspace.selectedPersonId);
  const chat = person?.chats.find((c) => c.id === person.selectedChatId);
  const closeSettings = () => setEditing(null);

  function send() {
    if (!person || !chat || typing[chat.id]) return;
    const text = drafts[chat.id]?.trim();
    if (!text) return;
    const message: NewMessage = { from: "me", text };
    setWorkspace((w) => addMessage(w, person.id, chat.id, message));
    setDrafts((d) => ({ ...d, [chat.id]: "" }));
    void requestReply(person, chat, self, [...chat.messages, message]);
  }

  return (
    <main className="app">
      <PeopleRow
        people={workspace.people}
        selectedId={workspace.selectedPersonId}
        onSelf={() => setEditing("self")}
        onSelect={(id) => setWorkspace((w) => ({ ...w, selectedPersonId: id }))}
        onAdd={() => setAdding(true)}
      />
      <ChatPills
        person={person}
        onSelect={(id) => person && setWorkspace((w) => selectChat(w, person.id, id))}
        onAdd={() => person && setWorkspace((w) => addChat(w, person.id))}
        onSettings={() => setEditing("person")}
      />

      {person && chat ? (
        <section className="conversation" key={`chat-${chat.id}`}>
          <Composer
            recipient={person.name}
            busy={!!typing[chat.id]}
            value={drafts[chat.id] ?? ""}
            onChange={(text) => setDrafts((d) => ({ ...d, [chat.id]: text }))}
            onSend={send}
            onSettings={() => setEditing("chat")}
          />
          <Thread
            name={person.name}
            messages={chat.messages}
            typing={!!typing[chat.id]}
            error={errors[chat.id]}
            onRetry={() => requestReply(person, chat, self, chat.messages)}
          />
        </section>
      ) : (
        <p className="empty">
          {person ? `Tap + to start a conversation with ${person.name}.` : "Add a person to chat with."}
        </p>
      )}

      {editing === "self" && (
        <SettingsDialog
          key="settings-self"
          kind="self"
          name=""
          profile={self ?? emptyProfile}
          onChange={(update) => setWorkspace((w) => updateSelf(w, update))}
          onClose={closeSettings}
        />
      )}

      {editing === "person" && person && (
        <SettingsDialog
          key={`settings-person-${person.id}`}
          kind="person"
          name={person.name}
          profile={person.profile ?? emptyProfile}
          toolbar={<ExportContext person={person} />}
          onChange={(update) => setWorkspace((w) => updateProfile(w, person.id, update))}
          onClose={closeSettings}
        />
      )}

      {editing === "chat" && person && chat && (
        <SettingsDialog
          key={`settings-chat-${chat.id}`}
          kind="chat"
          name={person.name}
          profile={chat.profile ?? emptyProfile}
          personProfile={person.profile}
          onChange={(update) => setWorkspace((w) => updateChatProfile(w, person.id, chat.id, update))}
          onClose={closeSettings}
        />
      )}

      {adding && (
        <AddPersonDialog
          onAdd={(name) => setWorkspace((w) => addPerson(w, name))}
          onImport={(imported) => setWorkspace((w) => addImportedPerson(w, imported))}
          onClose={() => setAdding(false)}
        />
      )}
    </main>
  );
}
