import { createTheme, type MantineColorsTuple } from "@mantine/core";

/**
 * Custom slate colour scale derived from the existing Tailwind-slate tokens
 * used throughout the app (globals.css + inline styles).
 */
const slate: MantineColorsTuple = [
  "#f8fafc", // 0 – lightest
  "#f1f5f9", // 1
  "#e2e8f0", // 2
  "#cbd5e1", // 3
  "#94a3b8", // 4
  "#64748b", // 5
  "#475569", // 6
  "#334155", // 7 – borders
  "#1e293b", // 8 – surface
  "#0f172a", // 9 – background
];

export const theme = createTheme({
  primaryColor: "blue",
  defaultRadius: "sm",
  fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",

  colors: { slate },

  /** Global component size/variant defaults so every consumer stays compact */
  components: {
    NumberInput: {
      defaultProps: { size: "xs" },
    },
    TextInput: {
      defaultProps: { size: "xs" },
    },
    Select: {
      defaultProps: { size: "xs" },
    },
    ColorInput: {
      defaultProps: { size: "xs" },
    },
    Textarea: {
      defaultProps: { size: "xs" },
    },
    Button: {
      defaultProps: { size: "xs" },
    },
    ActionIcon: {
      defaultProps: { size: "sm", variant: "subtle" },
    },
    Badge: {
      defaultProps: { size: "xs", variant: "default" },
    },
  },
});
