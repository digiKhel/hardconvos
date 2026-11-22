# The Hard Conversation Rehearsal

A mobile website that lets people rehearse hard conversations. It is a solo entry to the Speedrun buildathon at UnConference '26 (The Product Folks, Bengaluru).

## Problem statement

> We all have conversations we keep avoiding: telling a friend they hurt us, asking a parent to see a doctor, raising something awkward with a partner. Often it's not that we don't care, it's that we don't know how to start. I want an AI that lets me rehearse. I describe the situation and the person, it plays them realistically, and afterwards tells me what landed well and what might have sounded harsh. I'd pay for the confidence to have the conversations that matter instead of letting them fester.

Suggested and mentored by Nithin Rangarajan, VP Product, Chargebee.

## Buildathon constraints

All times are IST on Sunday 22 November 2026.

- 1:00 PM: four-hour buildathon opens (work on this repo began around 2:45 PM)
- 3:30 PM: check-in with the mentor (mentors are only there until 4:00 PM)
- 5:00 PM: submissions lock
- Deliverables: a deployed URL and a video
- Details: https://unconference.theproductfolks.com/speedrun (requires sign-in; the rules and judging criteria have not been reviewed yet)

Check the clock before adding scope, and leave time to record the video and submit.

## How we work

- Start with a basic skeleton, then add abilities one at a time, as the builder directs. Don't build ahead.
- Text first. At 4 PM, depending on progress, consider adding a voice element.

## Interface, as specified

A minimalist, mobile-friendly, responsive website. From top to bottom:

1. A row of people avatars, with an icon to add a person to chat with.
2. A row of pills (Chat 1, Chat 2, etc.), with a + to start a conversation. The leftmost button opens settings for the selected person.
3. When a person and one of their chats are selected, a text box to enter text.
4. Below the text box, the conversation so far, in standard messaging-app style.

The text box sits above the conversation on purpose.

## Feature status

**Built**
- The interface above. People, chats and messages are saved in the browser's localStorage.
- Person settings, in three sections: context, anecdotes of their past interactions (with the user or anyone else), and generated questions that probe how they would respond in different scenarios.

**In the brief, not built yet**
- Describe the situation (the person is covered by settings).
- The AI plays that person realistically.
- Afterwards, say what landed well and what might have sounded harsh.

**Chosen for a later step**
- Tune the person: how they usually react (defensive, dismissive, emotional, goes quiet) and how hard the rehearsal is.

**Proposed, decision deferred (ask before building)**
- Hidden thoughts: what the other person was thinking but didn't say.
- Rewind: try a moment again and see the reaction change.
- Confidence rating before and after the rehearsal.

## Available tools

- Claude
- Descope, Figr, smallest.ai, Fireflies.ai, Apify, CodeRabbit, Crustdata, Divyam.ai, Plivo, Nebius Token Factory, Replit, ElevenLabs

These are available, not required. Only Claude is integrated so far (`app/api/questions`).

## Code

- Next.js (App Router), React and TypeScript, with plain CSS
- `app/`: page, layout and global styles
- `components/`: interface components
- `lib/workspace.ts`: data model and state updates
- `lib/useWorkspace.ts`: browser persistence
- `npm run dev`: run locally on port 3000
- `npm run build` and `npm run typecheck`: run both before pushing
- Planned hosting: Vercel (not set up yet)

## This repo is public

- Never commit API keys. They belong in `.env.local` (gitignored) and in the host's environment settings.
- Call AI providers from server code only. Never expose a key through a `NEXT_PUBLIC_` variable.
- Don't commit real people's private situations, including as demo data.
