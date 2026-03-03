import { createClient } from "@sanity/client";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2024-01-01";

/** Returns true only when env vars look like real values (not placeholders). */
function isConfigured(): boolean {
  return (
    Boolean(projectId) &&
    projectId !== "your_project_id_here" &&
    /^[a-z0-9-]+$/.test(projectId)
  );
}

/** Public read-only CDN client — safe to use in the browser. Lazy-created. */
let _readClient: ReturnType<typeof createClient> | null = null;
export function getReadClient() {
  if (!_readClient) {
    if (!isConfigured()) {
      throw new Error(
        "NEXT_PUBLIC_SANITY_PROJECT_ID is not configured. Add your Sanity project ID to .env.local",
      );
    }
    _readClient = createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: true,
    });
  }
  return _readClient;
}

/**
 * Server-only write client.
 * Import ONLY inside Next.js API routes (app/api/**).
 * Never import from a component — the write token is server-only.
 */
export function getWriteClient() {
  if (!isConfigured()) {
    throw new Error(
      "NEXT_PUBLIC_SANITY_PROJECT_ID is not configured. Add your Sanity project ID to .env.local",
    );
  }
  const token = process.env.SANITY_WRITE_TOKEN;
  if (!token || token === "your_write_token_here") {
    throw new Error(
      "SANITY_WRITE_TOKEN is not set. Add it to .env.local as a server-only variable (create it at sanity.io → project → API → Tokens).",
    );
  }
  return createClient({ projectId, dataset, apiVersion, useCdn: false, token });
}
