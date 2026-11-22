// Server only: shared by the API routes that call Claude.
import Anthropic from "@anthropic-ai/sdk";
import { LIMITS } from "./limits";
import type { Message } from "./workspace";

export const fail = (message: string, status: number) => Response.json({ error: message }, { status });

export const clip = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");

const list = (value: unknown): any[] => (Array.isArray(value) ? value : []);

/** Escaped so that notes can't close the tags they sit in. */
export const data = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");

export function readMessage(item: any) {
  const from: Message["from"] = item?.from === "them" || item?.from === "note" ? item.from : "me";
  return { from, text: clip(item?.text, LIMITS.message), cue: clip(item?.cue, LIMITS.cue) };
}

/** Keeps other websites from spending the API key through visitors' browsers. */
export function fromThisSite(request: Request) {
  const origin = request.headers.get("origin");
  return !!origin && URL.canParse(origin) && new URL(origin).host === request.headers.get("host");
}

export function readProfile(value: any) {
  return {
    context: clip(value?.context, LIMITS.context),
    location: clip(value?.location, LIMITS.location),
    anecdotes: list(value?.anecdotes)
      .slice(0, LIMITS.anecdotes)
      .map((item) => clip(item, LIMITS.anecdote))
      .filter(Boolean),
    answered: list(value?.answered)
      .slice(-LIMITS.answered)
      .map((item) => ({
        question: clip(item?.question, LIMITS.question),
        answer: clip(item?.answer, LIMITS.answer),
      })),
  };
}

export function askClaude(params: {
  system: string;
  messages: Anthropic.Beta.BetaMessageParam[];
  schema?: Record<string, unknown>;
  maxTokens?: number;
  timeout?: number;
  maxRetries?: number;
}) {
  const client = new Anthropic({ timeout: params.timeout ?? 25_000, maxRetries: params.maxRetries ?? 1 });
  return client.beta.messages.create({
    model: "claude-opus-5-5",
    max_tokens: params.maxTokens ?? 4000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    cache_control: { type: "ephemeral" },
    system: params.system,
    messages: params.messages,
    output_config: {
      effort: "low",
      ...(params.schema && { format: { type: "json_schema", schema: params.schema } }),
    },
  });
}

/** Logs the failure only, never what the user wrote. */
export function claudeFailure(route: string, error: unknown) {
  if (error instanceof Anthropic.AuthenticationError) {
    console.error(`${route}: API key rejected`);
    return fail("The Claude API key was rejected.", 500);
  }
  if (error instanceof Anthropic.RateLimitError) {
    console.error(`${route}: rate limited`);
    return fail("Claude is busy. Try again in a moment.", 429);
  }
  if (error instanceof Anthropic.APIConnectionError) {
    console.error(`${route}: connection failed`);
    return fail("Couldn't reach Claude. Try again.", 502);
  }
  if (error instanceof Anthropic.APIError) {
    console.error(`${route}: API error`, error.status, error.message);
  } else {
    console.error(`${route}: failed`, error instanceof Error ? error.name : "unknown");
  }
  return fail("Something went wrong. Try again.", 500);
}
