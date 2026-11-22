import type { Person } from "@/lib/workspace";
import { AddPersonIcon } from "./icons";
import { ScrollRow } from "./ScrollRow";

type Props = {
  people: Person[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
};

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => Array.from(word)[0])
    .join("")
    .toUpperCase();

export function PeopleRow({ people, selectedId, onSelect, onAdd }: Props) {
  return (
    <ScrollRow
      className="people"
      label="People"
      selectedId={selectedId}
      action={
        <button className="person" onClick={onAdd} aria-label="Add a person to chat with">
          <span className="avatar add">
            <AddPersonIcon />
          </span>
          <span className="name">Add</span>
        </button>
      }
    >
      {people.map((person) => (
        <button
          key={person.id}
          className="person"
          aria-pressed={person.id === selectedId}
          onClick={() => onSelect(person.id)}
        >
          <span className="avatar" style={{ background: `hsl(${person.hue} 38% 42%)` }} aria-hidden>
            {initials(person.name)}
          </span>
          <span className="name">{person.name}</span>
        </button>
      ))}
    </ScrollRow>
  );
}
