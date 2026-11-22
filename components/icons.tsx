const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

export const AddPersonIcon = () => (
  <svg {...base}>
    <circle cx="9" cy="8" r="4" />
    <path d="M2.5 21a6.5 6.5 0 0 1 13 0M19 8v6M16 11h6" />
  </svg>
);

export const PlusIcon = () => (
  <svg {...base}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const SendIcon = () => (
  <svg {...base}>
    <path d="M12 19V5M5 12l7-7 7 7" />
  </svg>
);
