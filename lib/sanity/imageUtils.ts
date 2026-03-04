/**
 * Browser-only image utilities for the Sanity cloud integration.
 *
 * Responsibilities:
 *  - Convert data URIs to WebP blobs via <canvas>
 *  - Walk a ProjectSnapshot and extract / deduplicate all data URI images
 *  - Swap data URIs for stable hash-based placeholder keys so the snapshot
 *    can be sent to the server without giant base64 strings
 *  - Leave existing Sanity CDN URLs untouched (no re-upload on re-save)
 *  - resolveQuizImagesForExport: upload all images to Sanity and return
 *    a QuizData clone with CDN URLs — used by the export engine
 */

import type { ProjectSnapshot } from "@src/store/quizStore";
import type { QuizData } from "@src/lib/types";

const CDN_PREFIX = "https://cdn.sanity.io/";

export function isSanityCdn(s: string | null | undefined): boolean {
  return typeof s === "string" && s.startsWith(CDN_PREFIX);
}

export function isDataUri(s: string | null | undefined): boolean {
  return typeof s === "string" && s.startsWith("data:");
}

/** Convert any data URI to a WebP Blob at the given quality (0–1). */
export async function toWebP(dataUri: string, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas 2D context unavailable"));
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("canvas.toBlob() returned null"));
          resolve(blob);
        },
        "image/webp",
        quality,
      );
    };
    img.onerror = () => reject(new Error("Failed to load image data URI"));
    img.src = dataUri;
  });
}

/** Stable SHA-256 hex hash of a string (browser crypto.subtle). */
async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(s),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const PLACEHOLDER_PREFIX = "bls-img://";

/**
 * Walk the snapshot, convert all unique data URIs to WebP blobs,
 * replace them with `bls-img://<hash>` placeholders, and return:
 *  - `snapshot`  — clone with placeholders instead of data URIs
 *  - `blobs`     — Map<hash, Blob> of all images to upload
 *  - `b64Map`    — Map<hash, string> base64 strings ready for the API body
 */
export interface PreparedSnapshot {
  snapshot: ProjectSnapshot;
  b64Map: Record<string, string>; // hash → base64 WebP
}

export async function prepareSnapshot(
  original: ProjectSnapshot,
): Promise<PreparedSnapshot> {
  // deep clone so we don't mutate the store
  const snapshot: ProjectSnapshot = JSON.parse(JSON.stringify(original));

  const hashToB64 = new Map<string, string>();
  const uriToHash = new Map<string, string>();

  /** Process one potentially-data-URI field, return replacement string. */
  async function processUri(uri: string | null | undefined): Promise<string> {
    if (!uri || isSanityCdn(uri) || !isDataUri(uri)) return uri ?? "";
    if (uriToHash.has(uri)) return PLACEHOLDER_PREFIX + uriToHash.get(uri)!;

    const hash = await sha256Hex(uri);
    uriToHash.set(uri, hash);

    if (!hashToB64.has(hash)) {
      const blob = await toWebP(uri);
      const b64 = await blobToBase64(blob);
      hashToB64.set(hash, b64);
    }

    return PLACEHOLDER_PREFIX + hash;
  }

  // --- Walk all image fields in the snapshot ---
  if (snapshot.quizData.bg) {
    snapshot.quizData.bg = await processUri(snapshot.quizData.bg);
  }

  for (const frame of snapshot.quizData.frames) {
    if (frame.src) {
      frame.src = await processUri(frame.src);
    }
    for (const obj of frame.objects) {
      if (obj.type === "image" && obj.src) {
        obj.src = await processUri(obj.src);
      }
      if (obj.type === "answerGroup") {
        for (const ans of obj.answers) {
          if (ans.src) {
            ans.src = await processUri(ans.src);
          }
        }
      }
    }
  }

  const b64Map: Record<string, string> = {};
  for (const [hash, b64] of hashToB64) {
    b64Map[hash] = b64;
  }

  return { snapshot, b64Map };
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Walk every image field in QuizData, convert data URIs to WebP,
 * upload to Sanity via /api/cloud/upload-images, and return a deep clone
 * of QuizData with all data URIs replaced by Sanity CDN URLs.
 *
 * Already-CDN URLs are passed through untouched.
 */
export async function resolveQuizImagesForExport(
  quizData: QuizData,
): Promise<QuizData> {
  const clone: QuizData = JSON.parse(JSON.stringify(quizData));

  // Collect all unique data URIs
  const uriToHash = new Map<string, string>();
  const hashToB64 = new Map<string, string>();

  async function collect(uri: string | null | undefined): Promise<void> {
    if (!uri || isSanityCdn(uri) || !isDataUri(uri)) return;
    if (uriToHash.has(uri)) return;
    const hash = await sha256Hex(uri);
    uriToHash.set(uri, hash);
    if (!hashToB64.has(hash)) {
      const blob = await toWebP(uri);
      const b64 = await blobToBase64(blob);
      hashToB64.set(hash, b64);
    }
  }

  // Walk all image-bearing fields
  await collect(clone.bg);
  for (const frame of clone.frames) {
    await collect(frame.src ?? null);
    for (const obj of frame.objects) {
      if (obj.type === "image")
        await collect((obj as { src?: string }).src ?? null);
      if (obj.type === "answerGroup") {
        for (const ans of (obj as { answers: { src?: string }[] }).answers) {
          await collect(ans.src ?? null);
        }
      }
    }
  }

  if (hashToB64.size === 0) return clone; // nothing to upload

  // Upload all images to Sanity in one request
  const images: Record<string, string> = {};
  for (const [hash, b64] of hashToB64) images[hash] = b64;

  const res = await fetch("/api/cloud/upload-images", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ images }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to upload images to Sanity");
  }

  const { urls } = (await res.json()) as { urls: Record<string, string> };

  // Substitute CDN URLs back into the clone
  function substitute(uri: string | null | undefined): string | undefined {
    if (!uri || isSanityCdn(uri) || !isDataUri(uri)) return uri ?? undefined;
    const hash = uriToHash.get(uri);
    return hash ? (urls[hash] ?? uri) : uri;
  }

  if (clone.bg) clone.bg = substitute(clone.bg) ?? null;
  for (const frame of clone.frames) {
    if (frame.src) frame.src = substitute(frame.src) ?? null;
    for (const obj of frame.objects) {
      if (obj.type === "image") {
        const io = obj as { src?: string };
        if (io.src) io.src = substitute(io.src);
      }
      if (obj.type === "answerGroup") {
        for (const ans of (obj as { answers: { src?: string }[] }).answers) {
          if (ans.src) ans.src = substitute(ans.src);
        }
      }
    }
  }

  return clone;
}
