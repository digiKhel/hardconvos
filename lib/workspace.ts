export type Message = {
  id: string;
  from: "me" | "them";
  text: string;
  sentAt: number;
};

export type Chat = {
  id: string;
  title: string;
  messages: Message[];
};

export type Profile = {
  context: string;
  anecdotes: { id: string; text: string }[];
  questions: { id: string; text: string; answer: string }[];
  questionsBasis?: string;
};

export const emptyProfile: Profile = { context: "", anecdotes: [], questions: [] };

export type Person = {
  id: string;
  name: string;
  hue: number;
  chats: Chat[];
  selectedChatId: string | null;
  /** Absent until settings are first edited. */
  profile?: Profile;
};

export type Workspace = {
  people: Person[];
  selectedPersonId: string | null;
};

export const emptyWorkspace: Workspace = { people: [], selectedPersonId: null };

// Not crypto.randomUUID: it is unavailable when testing from a phone over plain HTTP.
export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

export function addPerson(workspace: Workspace, name: string): Workspace {
  const person: Person = {
    id: newId(),
    name,
    hue: (workspace.people.length * 137) % 360,
    chats: [],
    selectedChatId: null,
  };
  return { people: [...workspace.people, person], selectedPersonId: person.id };
}

function updatePerson(workspace: Workspace, id: string, update: (person: Person) => Person): Workspace {
  return { ...workspace, people: workspace.people.map((p) => (p.id === id ? update(p) : p)) };
}

export function updateProfile(
  workspace: Workspace,
  personId: string,
  update: (profile: Profile) => Profile,
): Workspace {
  return updatePerson(workspace, personId, (person) => ({
    ...person,
    profile: update(person.profile ?? emptyProfile),
  }));
}

export function addChat(workspace: Workspace, personId: string): Workspace {
  return updatePerson(workspace, personId, (person) => {
    const chat: Chat = { id: newId(), title: `Chat ${person.chats.length + 1}`, messages: [] };
    return { ...person, chats: [...person.chats, chat], selectedChatId: chat.id };
  });
}

export function selectChat(workspace: Workspace, personId: string, chatId: string): Workspace {
  return updatePerson(workspace, personId, (person) => ({ ...person, selectedChatId: chatId }));
}

export function addMessage(
  workspace: Workspace,
  personId: string,
  chatId: string,
  from: Message["from"],
  text: string,
): Workspace {
  const message: Message = { id: newId(), from, text, sentAt: Date.now() };
  return updatePerson(workspace, personId, (person) => ({
    ...person,
    chats: person.chats.map((c) => (c.id === chatId ? { ...c, messages: [...c.messages, message] } : c)),
  }));
}
