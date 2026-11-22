import type { Person } from "@/lib/workspace";
import { PlusIcon, SettingsIcon } from "./icons";
import { ScrollRow } from "./ScrollRow";

type Props = {
  person: Person | undefined;
  onSelect: (chatId: string) => void;
  onAdd: () => void;
  onSettings: () => void;
};

export function ChatPills({ person, onSelect, onAdd, onSettings }: Props) {
  return (
    <ScrollRow
      className="chats"
      label="Chats"
      selectedId={person?.selectedChatId}
      lead={
        <button
          className="pill icon"
          onClick={onSettings}
          disabled={!person}
          aria-label={person ? `Settings for ${person.name}` : "Person settings"}
        >
          <SettingsIcon />
        </button>
      }
      action={
        <button className="pill icon add" onClick={onAdd} disabled={!person} aria-label="Start a conversation">
          <PlusIcon />
        </button>
      }
    >
      {person?.chats.map((chat) => (
        <button
          key={chat.id}
          className="pill"
          aria-pressed={chat.id === person.selectedChatId}
          onClick={() => onSelect(chat.id)}
        >
          {chat.title}
        </button>
      ))}
    </ScrollRow>
  );
}
