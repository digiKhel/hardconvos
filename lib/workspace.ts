export type Message = {
  id: string;
  /** "note" is Claude stepping out of character. */
  from: "me" | "them" | "note";
  text: string;
  /** How they seem as they say it. Only on their messages. */
  cue?: string;
  sentAt: number;
};

export type NewMessage = Omit<Message, "id" | "sentAt">;

/** The three things that have settings. All three share the Profile shape. */
export type SettingsKind = "self" | "person" | "chat";

export const VERDICTS = ["landed", "mixed", "harsh"] as const;
export type Verdict = (typeof VERDICTS)[number];

export type MessageReview = { verdict: Verdict; what: string; differently: string; say: string };

export type Feedback = {
  /** The last message that had been sent when this was written. */
  through: string;
  /** Set instead of coaching when the user may be in real danger. */
  safety: string;
  overall: string;
  landed: string[];
  differently: string[];
  /** Keyed by message id. */
  reviews: Record<string, MessageReview>;
};

export type Chat = {
  id: string;
  title: string;
  messages: Message[];
  /** What this conversation is about. Absent until its settings are first edited. */
  profile?: Profile;
  feedback?: Feedback;
};

export type Profile = {
  /** For a chat, what it is about. */
  context: string;
  location?: string;
  /** What the user wants generated questions to prod them on. */
  focus?: string;
  /** For a chat, recent interactions between the two people. */
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
  self?: Profile;
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
  return { ...workspace, people: [...workspace.people, person], selectedPersonId: person.id };
}

export function addImportedPerson(workspace: Workspace, imported: Omit<Person, "hue">): Workspace {
  const person: Person = { ...imported, hue: (workspace.people.length * 137) % 360 };
  return { ...workspace, people: [...workspace.people, person], selectedPersonId: person.id };
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

export function updateSelf(workspace: Workspace, update: (profile: Profile) => Profile): Workspace {
  return { ...workspace, self: update(workspace.self ?? emptyProfile) };
}

export function updateChatProfile(
  workspace: Workspace,
  personId: string,
  chatId: string,
  update: (profile: Profile) => Profile,
): Workspace {
  return updatePerson(workspace, personId, (person) => ({
    ...person,
    chats: person.chats.map((c) => (c.id === chatId ? { ...c, profile: update(c.profile ?? emptyProfile) } : c)),
  }));
}

/** The user's messages that can be coached: all but those that led to a safety pause. */
export function reviewableIds(messages: Pick<Message, "id" | "from">[]) {
  const ids = new Set<string>();
  let paused = false;
  for (let i = messages.length - 1; i >= 0; i--) {
    const { id, from } = messages[i];
    if (from === "me") {
      if (!paused) ids.add(id);
    } else {
      paused = from === "note";
    }
  }
  return ids;
}

export function saveFeedback(workspace: Workspace, personId: string, chatId: string, feedback: Feedback): Workspace {
  return updatePerson(workspace, personId, (person) => ({
    ...person,
    chats: person.chats.map((c) =>
      c.id === chatId
        ? // Long chats are reviewed on recent messages only, so keep older reviews.
          { ...c, feedback: { ...feedback, reviews: { ...c.feedback?.reviews, ...feedback.reviews } } }
        : c,
    ),
  }));
}

/** What Claude is told from a profile. */
export function profileNotes(profile: Profile = emptyProfile) {
  return {
    context: profile.context.trim(),
    location: profile.location?.trim() ?? "",
    anecdotes: profile.anecdotes.map((a) => a.text.trim()).filter(Boolean),
    answered: profile.questions
      .filter((q) => q.answer.trim())
      .map(({ text, answer }) => ({ question: text, answer })),
  };
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
  content: NewMessage,
): Workspace {
  const message: Message = { ...content, id: newId(), sentAt: Date.now() };
  return updatePerson(workspace, personId, (person) => ({
    ...person,
    chats: person.chats.map((c) => (c.id === chatId ? { ...c, messages: [...c.messages, message] } : c)),
  }));
}
