import { useEffect, useRef } from "react";
import type { Frame } from "@src/lib/types";
import { drawHRuler, drawVRuler, useRuler } from "@src/hooks/useRuler";

interface Props {
  frame: Frame;
  onCanvasClick: (e: React.MouseEvent) => void;
  children: React.ReactNode;
  showRuler?: boolean;
  showGrid?: boolean;
}

export function RuledCanvas({
  frame,
  onCanvasClick,
  children,
  showRuler = true,
  showGrid = false,
}: Props) {
  const hRulerRef = useRef<HTMLCanvasElement>(null);
  const vRulerRef = useRef<HTMLCanvasElement>(null);
  const {
    vLineRef,
    hLineRef,
    cornerRef,
    handleCanvasMouseMove,
    handleCanvasMouseLeave,
  } = useRuler();

  useEffect(() => {
    if (!showRuler) return;
    if (hRulerRef.current && frame.w > 0)
      drawHRuler(hRulerRef.current, frame.w);
    if (vRulerRef.current && frame.h > 0)
      drawVRuler(vRulerRef.current, frame.h);
  }, [frame.w, frame.h, showRuler]);

  const rulerSize = showRuler ? 18 : 0;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `${rulerSize}px ${frame.w}px`,
        gridTemplateRows: `${rulerSize}px ${frame.h}px`,
        position: "relative",
      }}
    >
      {/* Crosshair corner readout */}
      {showRuler && <div ref={cornerRef} className="ruler-corner" />}
      {!showRuler && <div />}

      {/* Horizontal ruler */}
      {showRuler ? (
        <canvas
          ref={hRulerRef}
          className="ruler-h"
          width={frame.w || 1}
          height={18}
        />
      ) : (
        <div />
      )}

      {/* Vertical ruler */}
      {showRuler ? (
        <canvas
          ref={vRulerRef}
          className="ruler-v"
          width={18}
          height={frame.h || 1}
        />
      ) : (
        <div />
      )}

      {/* Frame canvas area */}
      <div
        className="frame-canvas"
        style={{ width: frame.w, height: frame.h }}
        onMouseMove={handleCanvasMouseMove}
        onMouseLeave={handleCanvasMouseLeave}
        onClick={onCanvasClick}
      >
        {/* Dot grid overlay */}
        {showGrid && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "radial-gradient(circle, rgba(148,163,184,0.45) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
              pointerEvents: "none",
              zIndex: 1,
            }}
          />
        )}
        {children}
      </div>

      {/* Vertical crosshair line */}
      <div
        ref={vLineRef}
        style={{
          display: "none",
          position: "absolute",
          top: 0,
          width: 1,
          background: "rgba(56,189,248,.8)",
          pointerEvents: "none",
          height: frame.h + 18,
          zIndex: 6,
        }}
      />

      {/* Horizontal crosshair line */}
      <div
        ref={hLineRef}
        style={{
          display: "none",
          position: "absolute",
          left: 0,
          height: 1,
          background: "rgba(56,189,248,.8)",
          pointerEvents: "none",
          width: frame.w + 18,
          zIndex: 6,
        }}
      />
    </div>
  );
}
