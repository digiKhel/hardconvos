import { LIMITS } from "./limits";
import { newId, VERDICTS, type Chat, type Feedback, type Message, type Person, type Profile } from "./workspace";

// Exports are JSON with plain key names: they paste back into the app, and also
// read sensibly when pasted anywhere else as text.
const FORMAT = "hardconvos-person-v1";

const SPEAKERS = { me: "me", them: "them", note: "rehearsal_paused" } as const;

const questionsOut = (profile?: Profile) =>
  (profile?.questions ?? []).map(({ text, answer }) => ({ question: text, answer }));

const textsOut = (profile?: Profile) =>
  (profile?.anecdotes ?? []).map((a) => a.text).filter((text) => text.trim());

// Message ids don't travel, so feedback points at messages by their number in the export.
function feedbackOut({ feedback, messages }: Chat) {
  if (!feedback) return;
  return {
    up_to_message: messages.findIndex((m) => m.id === feedback.through) + 1,
    safety: feedback.safety,
    overall: feedback.overall,
    landed_well: feedback.landed,
    do_differently: feedback.differently,
    by_message: messages.flatMap(({ id }, index) => {
      const review = feedback.reviews[id];
      return review ? [{ message: index + 1, ...review }] : [];
    }),
  };
}

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
        feedback: feedbackOut(chat),
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

function readFeedback(data: any, messages: Message[]): Feedback | undefined {
  const safety = str(data?.safety, LIMITS.feedback);
  const overall = str(data?.overall, LIMITS.feedback);
  if (!safety && !overall) return;

  const reviews: Feedback["reviews"] = {};
  for (const item of list(data.by_message)) {
    const message = messages[item?.message - 1];
    if (message?.from !== "me" || !VERDICTS.includes(item.verdict)) continue;
    reviews[message.id] = {
      verdict: item.verdict,
      what: str(item.what, LIMITS.feedback),
      differently: str(item.differently, LIMITS.feedback),
      say: str(item.say, LIMITS.feedback),
    };
  }
  const points = (value: unknown) => list(value).map((item) => str(item, LIMITS.feedback)).filter(Boolean);
  return {
    through: messages[data.up_to_message - 1]?.id ?? "",
    safety,
    overall,
    landed: points(data.landed_well),
    differently: points(data.do_differently),
    reviews,
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
    .map((chat, index) => {
      // Feedback is matched before empty messages are dropped, so the numbers still line up.
      const messages = list(chat.messages).map(readMessage);
      return {
        id: newId(),
        title: str(chat.title, LIMITS.name) || `Chat ${index + 1}`,
        profile: readProfile(chat, chat.about, chat.recent_interactions),
        messages: messages.filter((message) => message.text),
        feedback: readFeedback(chat.feedback, messages),
      };
    });

  return {
    id: newId(),
    name,
    profile: readProfile(data, data.context, data.anecdotes),
    chats,
    selectedChatId: chats.at(-1)?.id ?? null,
  };
}
