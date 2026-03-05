import { useRef, useCallback } from "react";

export function drawHRuler(cvs: HTMLCanvasElement, width: number) {
  if (!width || width <= 0 || !Number.isFinite(width)) return;
  try {
    // Explicitly set canvas width to the target value — this both resizes the
    // canvas AND resets it out of any prior error state (a no-self-assign reset
    // only works when the current .width is already a positive number).
    cvs.width = width;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#e5e7eb";
    ctx.fillRect(0, 0, width, 18);
    ctx.font = "7px sans-serif";
    for (let x = 0; x <= width; x += 10) {
      const maj = x % 50 === 0;
      ctx.fillStyle = maj ? "#6b7280" : "#9ca3af";
      ctx.fillRect(x, 18 - (maj ? 9 : 4), 1, maj ? 9 : 4);
      if (maj && x > 0) {
        ctx.fillStyle = "#6b7280";
        ctx.textAlign = "center";
        ctx.fillText(String(x), x, 7);
      }
    }
  } catch {
    // Canvas error state — will self-correct on next frame update
  }
}

export function drawVRuler(cvs: HTMLCanvasElement, height: number) {
  if (!height || height <= 0 || !Number.isFinite(height)) return;
  try {
    // Explicitly set canvas height — resets error state when prior height was 0.
    cvs.height = height;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#e5e7eb";
    ctx.fillRect(0, 0, 18, height);
    ctx.font = "7px sans-serif";
    for (let y = 0; y <= height; y += 10) {
      const maj = y % 50 === 0;
      ctx.fillStyle = maj ? "#6b7280" : "#9ca3af";
      ctx.fillRect(18 - (maj ? 9 : 4), y, maj ? 9 : 4, 1);
      if (maj && y > 0) {
        ctx.save();
        ctx.translate(9, y);
        ctx.rotate(-Math.PI / 2);
        ctx.fillStyle = "#6b7280";
        ctx.textAlign = "center";
        ctx.fillText(String(y), 0, 3);
        ctx.restore();
      }
    }
  } catch {
    // Canvas error state — will self-correct on next frame update
  }
}

export function useRuler(rulerSize = 18) {
  const vLineRef = useRef<HTMLDivElement>(null);
  const hLineRef = useRef<HTMLDivElement>(null);
  const cornerRef = useRef<HTMLDivElement>(null);

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      // CSS transform (zoom) on a parent makes getBoundingClientRect() return
      // visual/scaled dimensions while offsetWidth/Height stay in logical CSS px.
      // Dividing by this ratio converts screen coords → logical CSS coords.
      const scaleX = rect.width / el.offsetWidth;
      const scaleY = rect.height / el.offsetHeight;
      const x = Math.round((e.clientX - rect.left) / scaleX);
      const y = Math.round((e.clientY - rect.top) / scaleY);
      if (cornerRef.current) cornerRef.current.textContent = `${x},${y}`;
      if (vLineRef.current) {
        vLineRef.current.style.display = "block";
        vLineRef.current.style.left = rulerSize + x + "px";
      }
      if (hLineRef.current) {
        hLineRef.current.style.display = "block";
        hLineRef.current.style.top = rulerSize + y + "px";
      }
    },
    [rulerSize],
  );

  const handleCanvasMouseLeave = useCallback(() => {
    if (cornerRef.current) cornerRef.current.textContent = "";
    if (vLineRef.current) vLineRef.current.style.display = "none";
    if (hLineRef.current) hLineRef.current.style.display = "none";
  }, []);

  return {
    vLineRef,
    hLineRef,
    cornerRef,
    handleCanvasMouseMove,
    handleCanvasMouseLeave,
  };
}
