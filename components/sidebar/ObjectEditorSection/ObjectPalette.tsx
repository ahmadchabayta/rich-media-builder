import { Text, Box, UnstyledButton } from "@mantine/core";
import {
  IconTypography,
  IconPhoto,
  IconSquare,
  IconCircle,
  IconMinus,
  IconLayoutList,
} from "@tabler/icons-react";

interface PaletteProps {
  disabled: boolean;
  onText: () => void;
  onImage: () => void;
  onRect: () => void;
  onCircle: () => void;
  onLine: () => void;
  onAnswers: () => void;
}

const PALETTE_ITEMS = (p: PaletteProps) => [
  {
    icon: <IconTypography size={15} />,
    label: "Text",
    onClick: p.onText,
    color: "#60a5fa",
  },
  {
    icon: <IconPhoto size={15} />,
    label: "Image",
    onClick: p.onImage,
    color: "#a78bfa",
  },
  {
    icon: <IconSquare size={15} />,
    label: "Rect",
    onClick: p.onRect,
    color: "#22d3ee",
  },
  {
    icon: <IconCircle size={15} />,
    label: "Circle",
    onClick: p.onCircle,
    color: "#f472b6",
  },
  {
    icon: <IconMinus size={15} />,
    label: "Line",
    onClick: p.onLine,
    color: "#94a3b8",
  },
  {
    icon: <IconLayoutList size={15} />,
    label: "Answers",
    onClick: p.onAnswers,
    color: "#34d399",
  },
];

export function ObjectPalette(props: PaletteProps) {
  return (
    <div
      style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 5 }}
    >
      {PALETTE_ITEMS(props).map(({ icon, label, onClick, color }) => (
        <UnstyledButton
          key={label}
          onClick={onClick}
          disabled={props.disabled}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
            padding: "7px 4px",
            borderRadius: 6,
            background: "var(--mantine-color-dark-6)",
            border: "1px solid var(--mantine-color-dark-4)",
            opacity: props.disabled ? 0.4 : 1,
            cursor: props.disabled ? "not-allowed" : "pointer",
            transition: "background 120ms, border-color 120ms",
          }}
          onMouseEnter={(e) => {
            if (!props.disabled) {
              (e.currentTarget as HTMLButtonElement).style.background =
                "var(--mantine-color-dark-5)";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "var(--mantine-color-dark-3)";
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "var(--mantine-color-dark-6)";
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              "var(--mantine-color-dark-4)";
          }}
        >
          <Box style={{ color, lineHeight: 1 }}>{icon}</Box>
          <Text
            size="10px"
            c="dimmed"
            style={{ lineHeight: 1, userSelect: "none" }}
          >
            {label}
          </Text>
        </UnstyledButton>
      ))}
    </div>
  );
}
