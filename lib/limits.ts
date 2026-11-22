// Shared by the form and the API route, which is public once deployed.
export const LIMITS = {
  name: 40,
  context: 4000,
  anecdote: 2000,
  anecdotes: 20,
  question: 500,
  answer: 1500,
  answered: 30,
  message: 2000,
  history: 100,
  location: 300,
  focus: 500,
  cue: 300,
} as const;
