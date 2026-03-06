"use client";

import { del, get, set } from "idb-keyval";
import type { ProjectSnapshot } from "@src/store/types";

const INDEX_KEY = "bls-local-project-index";
const DATA_KEY_PREFIX = "bls-local-project:";

export interface LocalProjectMeta {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  frameCount: number;
}

function readIndex(): LocalProjectMeta[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LocalProjectMeta[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeIndex(next: LocalProjectMeta[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(INDEX_KEY, JSON.stringify(next));
}

function dataKey(id: string) {
  return `${DATA_KEY_PREFIX}${id}`;
}

function makeLocalId() {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function listLocalProjects(): Promise<LocalProjectMeta[]> {
  return [...readIndex()].sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function saveLocalProject(params: {
  id?: string;
  name: string;
  snapshot: ProjectSnapshot;
}) {
  const id = params.id ?? makeLocalId();
  const now = Date.now();
  const current = readIndex();
  const existing = current.find((p) => p.id === id);

  const meta: LocalProjectMeta = {
    id,
    name: params.name.trim() || "Untitled Project",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    frameCount: params.snapshot.quizData.frames.length,
  };

  await set(dataKey(id), params.snapshot);

  const next = [meta, ...current.filter((p) => p.id !== id)].sort(
    (a, b) => b.updatedAt - a.updatedAt,
  );

  writeIndex(next);
  return meta;
}

export async function loadLocalProject(
  id: string,
): Promise<ProjectSnapshot | null> {
  const data = (await get(dataKey(id))) as ProjectSnapshot | undefined;
  return data ?? null;
}

export async function deleteLocalProject(id: string) {
  await del(dataKey(id));
  const next = readIndex().filter((p) => p.id !== id);
  writeIndex(next);
}

export async function renameLocalProject(id: string, name: string) {
  const nextName = name.trim();
  if (!nextName) return;
  const next = readIndex().map((p) =>
    p.id === id ? { ...p, name: nextName, updatedAt: Date.now() } : p,
  );
  writeIndex(next);
}
