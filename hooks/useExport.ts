import { useCallback, useState } from "react";
import { useQuizStore } from "@src/store/quizStore";
import { generateExportFiles } from "@src/lib/exportEngine";
import { applyLocaleToQuizData } from "@src/lib/localeUtils";
import { notifications } from "@mantine/notifications";
import { zipSync, strToU8 } from "fflate";
import type { QuizData } from "@src/lib/types";
import type { ExportMeta } from "@src/store/types";

// ---------------------------------------------------------------------------
// Image helpers
// ---------------------------------------------------------------------------

/** Convert any image src (data URI or http/https URL) to WebP bytes via canvas. */
async function srcToWebPBytes(src: string): Promise<Uint8Array> {
  // For remote URLs (Sanity CDN, etc.) fetch the bytes first and turn them into
  // a same-origin blob URL — cross-origin <img> taints the canvas and fails.
  let objectUrl: string | null = null;
  let drawSrc = src;

  if (src.startsWith("http://") || src.startsWith("https://")) {
    // Proxy through our API route to avoid CORS restrictions on external images
    const proxied = `/api/proxy-image?url=${encodeURIComponent(src)}`;
    const resp = await fetch(proxied);
    if (!resp.ok)
      throw new Error(`Fetch failed (${resp.status}): ${src.slice(0, 80)}`);
    const blob = await resp.blob();
    objectUrl = URL.createObjectURL(blob);
    drawSrc = objectUrl;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        return reject(new Error("Canvas 2D context unavailable"));
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (objectUrl) URL.revokeObjectURL(objectUrl);
          if (!blob) return reject(new Error("canvas.toBlob failed"));
          blob
            .arrayBuffer()
            .then((ab) => resolve(new Uint8Array(ab)))
            .catch(reject);
        },
        "image/webp",
        0.92,
      );
    };
    img.onerror = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(new Error(`Image load failed: ${src.slice(0, 80)}`));
    };
    img.src = drawSrc;
  });
}

/**
 * Walk all image fields in quizData, convert each unique src to a WebP file,
 * and replace the src with a relative `assets/img_NNN.webp` path.
 *
 * Returns:
 *  - `resolvedQuizData` – deep clone with rewritten src values
 *  - `assets`           – map of `assets/img_NNN.webp` → raw bytes for ZIP
 */
async function collectAssets(quizData: QuizData): Promise<{
  resolvedQuizData: QuizData;
  assets: Record<string, Uint8Array>;
}> {
  const srcToPath = new Map<string, string>();
  const assets: Record<string, Uint8Array> = {};
  let counter = 0;

  async function resolve(src: string | undefined): Promise<string | null> {
    if (!src) return null;
    if (srcToPath.has(src)) return srcToPath.get(src)!;

    const idx = String(++counter).padStart(3, "0");
    const assetPath = `assets/img_${idx}.webp`;
    const bytes = await srcToWebPBytes(src);
    assets[assetPath] = bytes;
    srcToPath.set(src, assetPath);
    return assetPath;
  }

  // Deep-clone so we never mutate the store
  const clone: QuizData = JSON.parse(JSON.stringify(quizData));

  if (clone.bg) clone.bg = await resolve(clone.bg);

  for (const frame of clone.frames) {
    if (frame.bgImage) frame.bgImage = await resolve(frame.bgImage);
    if (frame.src) frame.src = await resolve(frame.src);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const obj of frame.objects as any[]) {
      if (obj.src) obj.src = await resolve(obj.src);

      if (obj.answers) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const ans of obj.answers as any[]) {
          if (ans.src) ans.src = await resolve(ans.src);
        }
      }
    }
  }

  return { resolvedQuizData: clone, assets };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useExport() {
  const quizData = useQuizStore((s) => s.quizData);
  const defaultW = useQuizStore((s) => s.defaultW);
  const defaultH = useQuizStore((s) => s.defaultH);
  const exportMeta = useQuizStore((s) => s.exportMeta);
  const customCss = useQuizStore((s) => s.customCss);
  const [exporting, setExporting] = useState(false);

  const exportQuiz = useCallback(async () => {
    if (quizData.frames.length < 2) {
      notifications.show({
        title: "Not enough frames",
        message: "Please add at least 2 frames before exporting.",
        color: "yellow",
        autoClose: 4000,
      });
      return;
    }

    setExporting(true);
    const notifId = notifications.show({
      id: "export",
      loading: true,
      title: "Preparing export…",
      message: "Converting images to WebP…",
      autoClose: false,
      withCloseButton: false,
    });

    try {
      // Convert every image → assets/img_NNN.webp and rewrite srcs
      const { resolvedQuizData: _resolved, assets } =
        await collectAssets(quizData);
      // Merge custom CSS into the resolved data for the export engine
      const resolvedQuizData = { ..._resolved, customCss };

      notifications.update({
        id: notifId,
        loading: true,
        title: "Building ZIP…",
        message: "Generating HTML / CSS / JS",
        autoClose: false,
        withCloseButton: false,
      });

      const meta: ExportMeta = exportMeta;
      const hasMetadata =
        meta.clientName.trim() &&
        meta.adName.trim() &&
        meta.countries.length > 0 &&
        meta.countries.every((c) => c.code.trim() && c.languages.length > 0);

      const zipEntries: Record<string, Uint8Array> = {};

      if (hasMetadata) {
        // ── Structured export: client/kind/name-variant/country/ ──
        const client = meta.clientName
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "-");
        const adName = meta.adName.trim().toLowerCase().replace(/\s+/g, "-");
        const kind = meta.adKind.trim().toLowerCase() || "bls";

        for (const country of meta.countries) {
          const cc = country.code.trim().toLowerCase();

          for (const ln of country.languages
            .map((l) => l.trim().toLowerCase())
            .filter(Boolean)) {
            // ── Apply translations for this locale ──
            console.log(
              `[export] locale="${ln}" translationKeys=`,
              Object.keys(resolvedQuizData.translations ?? {}),
              `entries for "${ln}":`,
              Object.keys(resolvedQuizData.translations?.[ln] ?? {}),
            );
            const localizedData =
              ln === "en"
                ? resolvedQuizData
                : applyLocaleToQuizData(resolvedQuizData, ln);

            for (const variant of ["exposed", "controlled"] as const) {
              const creativeName = `${client}-${adName}-${ln}-${variant}`;
              const folderPath = `${client}/${kind}-${ln}/${adName}-${variant}/${cc}`;

              const trackerMeta =
                variant === "exposed"
                  ? {
                      creativeName,
                      countryCode: cc.toUpperCase(),
                      language: ln,
                    }
                  : undefined; // controlled version has no tracker

              const files = generateExportFiles(
                localizedData,
                defaultW,
                defaultH,
                trackerMeta,
              );

              zipEntries[`${folderPath}/index.html`] = strToU8(files.html);
              zipEntries[`${folderPath}/ad.css`] = strToU8(files.css);
              zipEntries[`${folderPath}/ad.js`] = strToU8(files.js);

              for (const [assetPath, bytes] of Object.entries(assets)) {
                zipEntries[`${folderPath}/${assetPath}`] = bytes;
              }
            } // end variant
          } // end language
        }
      } else {
        // ── Legacy flat export ──
        const folder = `quiz_bls_${defaultW}x${defaultH}`;
        const files = generateExportFiles(resolvedQuizData, defaultW, defaultH);

        zipEntries[`${folder}/index.html`] = strToU8(files.html);
        zipEntries[`${folder}/ad.css`] = strToU8(files.css);
        zipEntries[`${folder}/ad.js`] = strToU8(files.js);

        for (const [assetPath, bytes] of Object.entries(assets)) {
          zipEntries[`${folder}/${assetPath}`] = bytes;
        }
      }

      const zipped = zipSync(zipEntries);
      const zipName = hasMetadata
        ? `${meta.clientName.trim().toLowerCase().replace(/\s+/g, "-")}-${meta.adName.trim().toLowerCase().replace(/\s+/g, "-")}.zip`
        : `quiz_bls_${defaultW}x${defaultH}.zip`;

      const blob = new Blob([zipped as unknown as Uint8Array<ArrayBuffer>], {
        type: "application/zip",
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = zipName;
      a.click();
      URL.revokeObjectURL(a.href);

      const assetCount = Object.keys(assets).length;
      const folderCount = Object.keys(zipEntries).filter((k) =>
        k.endsWith("index.html"),
      ).length;
      notifications.update({
        id: notifId,
        loading: false,
        color: "green",
        title: "Export ready",
        message: `${zipName} – ${folderCount} variant${folderCount !== 1 ? "s" : ""}, ${assetCount} image${assetCount !== 1 ? "s" : ""}`,
        autoClose: 4000,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      notifications.update({
        id: notifId,
        loading: false,
        color: "red",
        title: "Export failed",
        message,
        autoClose: 6000,
      });
    } finally {
      setExporting(false);
    }
  }, [quizData, defaultW, defaultH, exportMeta, customCss]);

  return { exportQuiz, exporting };
}
