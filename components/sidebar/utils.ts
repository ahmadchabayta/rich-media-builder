/** Convert Mantine NumberInput value (number | string) to a number. */
export const n = (v: string | number, fb = 0): number =>
  v === "" ? fb : Number(v);

/** Shared amber box style for animation panels. */
export const animBoxStyle = {
  border: "1px solid rgba(217,119,6,0.45)",
  borderRadius: "var(--mantine-radius-sm)",
  background: "rgba(120,60,0,0.15)",
} as const;
