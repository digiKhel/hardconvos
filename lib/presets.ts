import cook from "@/presets/cook.json";
import { importPerson } from "./transfer";
import type { Person, Profile, Workspace } from "./workspace";

// The demo persona every visitor gets. presets/cook.json is the text that
// Export context copies, so updating it means replacing that file with an export.
const ID = "preset-cook";
// The persona's id before it was renamed, still saved in some browsers.
const OLD_ID = "preset-maid";

const isBlank = (profile?: Profile) =>
  !profile?.context.trim() && !profile?.anecdotes.length && !profile?.questions.length;

/** Puts Cook first, without overwriting anything this visitor has written. */
export function withPresets(workspace: Workspace): Workspace {
  const preset = importPerson(JSON.stringify(cook));
  if (!preset) return workspace;

  const { people } = workspace;
  const existing =
    people.find((p) => p.id === ID || p.id === OLD_ID) ?? people.find((p) => p.name.trim().toLowerCase() === "cook");

  const person: Person = existing
    ? {
        ...existing,
        name: preset.name,
        profile: isBlank(existing.profile) ? preset.profile : existing.profile,
        chats: existing.chats.length ? existing.chats : preset.chats,
        selectedChatId: existing.chats.length ? existing.selectedChatId : preset.selectedChatId,
      }
    : { ...preset, id: ID, hue: 28 };

  return {
    ...workspace,
    people: [person, ...people.filter((p) => p !== existing)],
    selectedPersonId: workspace.selectedPersonId ?? person.id,
  };
}
