// Palenight theme colors
export const colors = {
  background: "#292d3e",
  foreground: "#a6accd",

  // UI elements
  border: "#4e5579",
  muted: "#676e95",

  // Accents
  accent: "#82aaff",
  accentBright: "#c3e88d",

  // Semantic
  success: "#c3e88d",
  warning: "#ffcb6b",
  error: "#ff5370",
  info: "#89ddff",

  // Category colors (flat for backward compatibility)
  trash: "#ff5370",
  reference: "#c792ea",
  someday: "#ffcb6b",
  do_now: "#c3e88d",
  delegate: "#89ddff",
  context: "#82aaff",
  project: "#f78c6c",

  // Category colors (nested for new components)
  categories: {
    trash: "#ff5370",
    reference: "#c792ea",
    someday: "#ffcb6b",
    do_now: "#c3e88d",
    delegate: "#89ddff",
    context: "#82aaff",
    project: "#f78c6c",
  },
} as const;
