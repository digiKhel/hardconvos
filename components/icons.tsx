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

export const SelfIcon = () => (
  <svg {...base}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
  </svg>
);

export const PlusIcon = () => (
  <svg {...base}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const SettingsIcon = () => (
  <svg {...base}>
    <circle cx="12" cy="12" r="3" />
    <path d="M10 2.5h4l.6 2.6 1.8 1 2.5-.7 2 3.4-1.9 1.9v2.6l1.9 1.9-2 3.4-2.5-.7-1.8 1-.6 2.6h-4l-.6-2.6-1.8-1-2.5.7-2-3.4L5 13.3v-2.6L3.1 8.8l2-3.4 2.5.7 1.8-1z" />
  </svg>
);

export const CloseIcon = () => (
  <svg {...base}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const SendIcon = () => (
  <svg {...base}>
    <path d="M12 19V5M5 12l7-7 7 7" />
  </svg>
);
