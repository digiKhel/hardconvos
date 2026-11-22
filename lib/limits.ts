// Shared by the form and the API route, which is public once deployed.
export const LIMITS = {
  name: 40,
  context: 4000,
  anecdote: 2000,
  anecdotes: 20,
  question: 500,
  answer: 1500,
  answered: 30,
} as const;
