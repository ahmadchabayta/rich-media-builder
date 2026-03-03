/**
 * Zustand StateStorage adapter backed by IndexedDB via idb-keyval.
 * IndexedDB handles 250 MB+ vs localStorage's 5 MB, which is required
 * because we store base64 image data in the quiz state.
 *
 * The adapter is lazy — idb-keyval is only imported on the client, so
 * Next.js SSR (which has no window/indexedDB) never touches it.
 */

import type { StateStorage } from "zustand/middleware";

// Lazily resolved idb-keyval functions so SSR never runs them.
let _get: ((key: string) => Promise<unknown>) | null = null;
let _set: ((key: string, value: unknown) => Promise<void>) | null = null;
let _del: ((key: string) => Promise<void>) | null = null;

async function loadIdb() {
  if (_get) return;
  const idb = await import("idb-keyval");
  _get = idb.get;
  _set = idb.set;
  _del = idb.del;
}

export const idbStorage: StateStorage = {
  async getItem(name) {
    await loadIdb();
    const value = await _get!(name);
    return (value as string | null | undefined) ?? null;
  },
  async setItem(name, value) {
    await loadIdb();
    await _set!(name, value);
  },
  async removeItem(name) {
    await loadIdb();
    await _del!(name);
  },
};
