import { LIMITS } from "./limits";
import { newId, type Chat, type Message, type Person, type Profile } from "./workspace";

// Exports are JSON with plain key names: they paste back into the app, and also
// read sensibly when pasted anywhere else as text.
const FORMAT = "hardconvos-person-v1";

const SPEAKERS = { me: "me", them: "them", note: "rehearsal_paused" } as const;

const questionsOut = (profile?: Profile) =>
  (profile?.questions ?? []).map(({ text, answer }) => ({ question: text, answer }));

const textsOut = (profile?: Profile) =>
  (profile?.anecdotes ?? []).map((a) => a.text).filter((text) => text.trim());

export function exportPerson(person: Person, includeChats: boolean) {
  const { profile } = person;
  const data = {
    format: FORMAT,
    name: person.name,
    context: profile?.context ?? "",
    anecdotes: textsOut(profile),
    question_focus: profile?.focus ?? "",
    questions: questionsOut(profile),
    ...(includeChats && {
      chats: person.chats.map((chat) => ({
        title: chat.title,
        about: chat.profile?.context ?? "",
        location: chat.profile?.location ?? "",
        recent_interactions: textsOut(chat.profile),
        question_focus: chat.profile?.focus ?? "",
        questions: questionsOut(chat.profile),
        messages: chat.messages.map(({ from, text, cue, sentAt }) => ({
          from: SPEAKERS[from],
          ...(cue && { cue }),
          text,
          at: new Date(sentAt).toISOString(),
        })),
      })),
    }),
  };
  return JSON.stringify(data, null, 2);
}

const list = (value: unknown): any[] => (Array.isArray(value) ? value : []);
const str = (value: unknown, max: number) => (typeof value === "string" ? value.slice(0, max) : "");

function readProfile(data: any, context: unknown, anecdotes: unknown): Profile {
  return {
    context: str(context, LIMITS.context),
    location: str(data.location, LIMITS.location),
    focus: str(data.question_focus, LIMITS.focus),
    anecdotes: list(anecdotes)
      .slice(0, LIMITS.anecdotes)
      .map((item) => ({ id: newId(), text: str(item, LIMITS.anecdote) }))
      .filter((item) => item.text.trim()),
    questions: list(data.questions)
      .map((item) => ({
        id: newId(),
        text: str(item?.question, LIMITS.question),
        answer: str(item?.answer, LIMITS.answer),
      }))
      .filter((item) => item.text.trim()),
  };
}

function readMessage(data: any): Message {
  const sentAt = Date.parse(data?.at);
  return {
    id: newId(),
    from: data?.from === "them" ? "them" : data?.from === SPEAKERS.note ? "note" : "me",
    text: str(data?.text, LIMITS.message),
    cue: str(data?.cue, LIMITS.cue),
    sentAt: Number.isNaN(sentAt) ? Date.now() : sentAt,
  };
}

/** Reads pasted export text, ignoring anything around it. Returns null if it isn't an export. */
export function importPerson(pasted: string): Omit<Person, "hue"> | null {
  let data: any;
  try {
    data = JSON.parse(pasted.slice(pasted.indexOf("{"), pasted.lastIndexOf("}") + 1));
  } catch {
    return null;
  }
  const name = str(data?.name, LIMITS.name).trim();
  if (data?.format !== FORMAT || !name) return null;

  const chats: Chat[] = list(data.chats)
    .filter((chat) => chat && typeof chat === "object")
    .map((chat, index) => ({
      id: newId(),
      title: str(chat.title, LIMITS.name) || `Chat ${index + 1}`,
      profile: readProfile(chat, chat.about, chat.recent_interactions),
      messages: list(chat.messages).map(readMessage).filter((message) => message.text),
    }));

  return {
    id: newId(),
    name,
    profile: readProfile(data, data.context, data.anecdotes),
    chats,
    selectedChatId: chats.at(-1)?.id ?? null,
  };
}
