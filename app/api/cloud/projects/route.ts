import { NextResponse } from "next/server";
import { getWriteClient } from "@src/lib/sanity/client";
import { ALL_PROJECTS_QUERY } from "@src/lib/sanity/queries";

export async function GET() {
  try {
    // Use write client so we see drafts too; adjust to readClient if you only want published
    const client = getWriteClient();
    const projects = await client.fetch(ALL_PROJECTS_QUERY);
    return NextResponse.json(projects);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cloud/projects GET]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
