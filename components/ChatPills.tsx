import type { Person } from "@/lib/workspace";
import { PlusIcon } from "./icons";
import { ScrollRow } from "./ScrollRow";

type Props = {
  person: Person | undefined;
  onSelect: (chatId: string) => void;
  onAdd: () => void;
};

export function ChatPills({ person, onSelect, onAdd }: Props) {
  return (
    <ScrollRow
      className="chats"
      label="Chats"
      selectedId={person?.selectedChatId}
      action={
        <button className="pill add" onClick={onAdd} disabled={!person} aria-label="Start a conversation">
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
