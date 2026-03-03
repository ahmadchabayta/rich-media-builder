/**
 * Browser-only image utilities for the Sanity cloud integration.
 *
 * Responsibilities:
 *  - Convert data URIs to WebP blobs via <canvas>
 *  - Walk a ProjectSnapshot and extract / deduplicate all data URI images
 *  - Swap data URIs for stable hash-based placeholder keys so the snapshot
 *    can be sent to the server without giant base64 strings
 *  - Leave existing Sanity CDN URLs untouched (no re-upload on re-save)
 */

import type { ProjectSnapshot } from "@src/store/quizStore";

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
