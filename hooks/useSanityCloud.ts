import { useState, useCallback } from "react";
import { notifications } from "@mantine/notifications";
import { useQuizStore } from "@src/store/quizStore";
import { prepareSnapshot } from "@src/lib/sanity/imageUtils";

export interface CloudProjectMeta {
  _id: string;
  _updatedAt: string;
  title: string;
  status: string;
  format?: string;
  client?: string;
  adSizeW?: number;
  adSizeH?: number;
  publishDate?: string;
  endDate?: string;
  platforms?: string[];
  tags?: string[];
  thumbnailUrl?: string;
  campaignName?: string;
}

export interface SaveMeta {
  title: string;
  status?: string;
  format?: string;
  client?: string;
  notes?: string;
  publishDate?: string;
  endDate?: string;
  platforms?: string[];
  tags?: string[];
  audience?: {
    ageRanges?: string[];
    gender?: string;
    devices?: string[];
    interests?: string[];
    regions?: string[];
  };
}

export function useSanityCloud() {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<CloudProjectMeta[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  const setCloudProjectId = useQuizStore((s) => s.setCloudProjectId);

  /** Save (or update) the current project to Sanity. */
  const saveToCloud = useCallback(
    async (meta: SaveMeta): Promise<string | null> => {
      setSaving(true);
      const notifId = notifications.show({
        id: "cloud-save",
        loading: true,
        title: "Uploading to cloud…",
        message: "Converting images to WebP and uploading",
        autoClose: false,
        withCloseButton: false,
      });
      try {
        const state = useQuizStore.getState();
        const rawSnapshot = {
          version: 1,
          quizData: state.quizData,
          defaultW: state.defaultW,
          defaultH: state.defaultH,
          currentPreviewIndex: state.currentPreviewIndex,
        };

        // Convert data URIs → WebP blobs, replace with placeholders
        const { snapshot, b64Map } = await prepareSnapshot(rawSnapshot);

        const body = {
          id: state.cloudProjectId ?? undefined,
          meta,
          snapshot,
          images: b64Map,
        };

        const res = await fetch("/api/cloud/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? "Unknown error");
        }

        const { id } = await res.json();
        setCloudProjectId(id);

        notifications.update({
          id: notifId,
          loading: false,
          title: "Saved to cloud ✅",
          message: `"${meta.title}" is saved.`,
          color: "green",
          autoClose: 3000,
        });
        return id;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        notifications.update({
          id: notifId,
          loading: false,
          title: "Cloud save failed",
          message,
          color: "red",
          autoClose: 6000,
        });
        return null;
      } finally {
        setSaving(false);
      }
    },
    [setCloudProjectId],
  );

  /** Fetch the list of all cloud projects (overview only). */
  const listProjects = useCallback(async () => {
    setProjectsLoading(true);
    try {
      const res = await fetch("/api/cloud/projects");
      if (!res.ok) throw new Error("Failed to fetch projects");
      const data: CloudProjectMeta[] = await res.json();
      setProjects(data);
    } catch (err: unknown) {
      notifications.show({
        title: "Fetch failed",
        message: err instanceof Error ? err.message : String(err),
        color: "red",
      });
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  /** Load a project from Sanity into the producer. */
  const loadFromCloud = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cloud/projects/${id}`);
      if (!res.ok) throw new Error("Project not found");
      const doc = await res.json();
      if (!doc.snapshotJson) throw new Error("Project has no snapshot data");
      const snapshot = JSON.parse(doc.snapshotJson);
      useQuizStore.getState().loadProject(snapshot);
      useQuizStore.getState().setCloudProjectId(id);
      notifications.show({
        title: "Project loaded ✅",
        message: `"${doc.title}" loaded from cloud.`,
        color: "teal",
        autoClose: 3000,
      });
      return true;
    } catch (err: unknown) {
      notifications.show({
        title: "Load failed",
        message: err instanceof Error ? err.message : String(err),
        color: "red",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /** Delete a project from Sanity. */
  const deleteProject = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/cloud/projects/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      setProjects((prev) => prev.filter((p) => p._id !== id));
      // If the deleted project was the active one, clear cloudProjectId
      if (useQuizStore.getState().cloudProjectId === id) {
        useQuizStore.getState().setCloudProjectId(null);
      }
      return true;
    } catch (err: unknown) {
      notifications.show({
        title: "Delete failed",
        message: err instanceof Error ? err.message : String(err),
        color: "red",
      });
      return false;
    }
  }, []);

  /** Quick-patch meta fields without touching the snapshot. */
  const patchMeta = useCallback(
    async (id: string, patch: Partial<SaveMeta>): Promise<boolean> => {
      try {
        const res = await fetch(`/api/cloud/projects/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (!res.ok) throw new Error("Patch failed");
        notifications.show({
          title: "Updated",
          message: "Project metadata saved.",
          color: "teal",
          autoClose: 2000,
        });
        return true;
      } catch (err: unknown) {
        notifications.show({
          title: "Update failed",
          message: err instanceof Error ? err.message : String(err),
          color: "red",
        });
        return false;
      }
    },
    [],
  );

  return {
    saving,
    loading,
    projects,
    projectsLoading,
    saveToCloud,
    listProjects,
    loadFromCloud,
    deleteProject,
    patchMeta,
  };
}
