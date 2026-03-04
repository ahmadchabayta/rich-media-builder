import type { PointerEvent } from "react";

export interface DiamondProps {
  x: number; // 0–1 normalised position
  selected: boolean;
  isEndpoint: boolean; // 0% or 100%
  onPointerDown: (e: PointerEvent) => void;
  onClick: () => void;
}

export function Diamond({
  x,
  selected,
  isEndpoint,
  onPointerDown,
  onClick,
}: DiamondProps) {
  const left = `${x * 100}%`;
  return (
    <div
      onPointerDown={onPointerDown}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{
        position: "absolute",
        left,
        top: "50%",
        transform: "translate(-50%, -50%) rotate(45deg)",
        width: 10,
        height: 10,
        background: selected ? "#ffd43b" : isEndpoint ? "#666" : "#4dabf7",
        border: `2px solid ${selected ? "#fff" : "#888"}`,
        cursor: isEndpoint ? "default" : "grab",
        zIndex: selected ? 10 : 5,
        borderRadius: 2,
        transition: "background 0.1s",
      }}
    />
  );
}
