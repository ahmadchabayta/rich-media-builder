import React from "react";
import { ActionIcon } from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import type { Frame, QuizData } from "@src/lib/types";

interface FrameBackgroundProps {
  frame: Frame;
  quizBg: string | null | undefined;
  index: number;
  updateFrameField: (index: number, patch: Partial<Frame>) => void;
  setBg: (bg: string | null) => void;
}

export function FrameBackground({
  frame,
  quizBg,
  index,
  updateFrameField,
  setBg,
}: FrameBackgroundProps) {
  return (
    <>
      {/* Per-frame background color or gradient */}
      {(frame.bgColor || frame.bgGradient) && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: frame.bgGradient
              ? `linear-gradient(${frame.bgGradient.angle}deg, ${frame.bgGradient.stops[0]}, ${frame.bgGradient.stops[1]})`
              : frame.bgColor,
          }}
        />
      )}

      {/* Per-frame background image */}
      {(frame.bgImage ?? quizBg) &&
        (() => {
          const src = frame.bgImage ?? quizBg!;
          const anim = frame.bgImageAnim;
          const animStyle: React.CSSProperties =
            anim?.type && anim.type !== "none"
              ? {
                  animation: `${anim.type} ${anim.dur}ms ease-in-out infinite alternate`,
                }
              : {};
          return (
            <>
              <img
                src={src}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: (frame.bgImageSize ??
                    "cover") as React.CSSProperties["objectFit"],
                  objectPosition: `${frame.bgImagePosX ?? 50}% ${frame.bgImagePosY ?? 50}%`,
                  pointerEvents: "none",
                  ...animStyle,
                }}
                alt=""
              />
              {(frame.bgImage || quizBg) && (
                <ActionIcon
                  size={16}
                  color="red"
                  variant="filled"
                  radius="xl"
                  title="Remove background image"
                  style={{
                    position: "absolute",
                    top: 4,
                    left: 4,
                    zIndex: 25,
                    opacity: 0.85,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (frame.bgImage)
                      updateFrameField(index, {
                        bgImage: null,
                        bgImageAnim: null,
                      } as Partial<Frame>);
                    else setBg(null);
                  }}
                >
                  <IconX size={9} />
                </ActionIcon>
              )}
            </>
          );
        })()}

      {/* Frame base image or empty placeholder */}
      {frame.src ? (
        <img
          src={frame.src}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            pointerEvents: "none",
          }}
          alt=""
        />
      ) : frame.objects.length === 0 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <span style={{ color: "#334155", fontSize: 11, textAlign: "center" }}>
            Empty
            <br />
            frame
          </span>
        </div>
      ) : null}
    </>
  );
}
