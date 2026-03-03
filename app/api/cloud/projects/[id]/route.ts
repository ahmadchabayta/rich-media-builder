import { NextRequest, NextResponse } from "next/server";
import { getWriteClient } from "@src/lib/sanity/client";
import { PROJECT_BY_ID_QUERY } from "@src/lib/sanity/queries";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const client = getWriteClient();
    const doc = await client.fetch(PROJECT_BY_ID_QUERY, { id });
    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(doc);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const client = getWriteClient();
    await client.delete(id);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** PATCH — update meta fields only (status, dates, notes, etc.) without touching snapshotJson. */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const client = getWriteClient();
    // Only allow safe meta fields
    const allowed = [
      "status",
      "publishDate",
      "endDate",
      "notes",
      "tags",
      "platforms",
      "audience",
      "title",
      "client",
      "format",
    ];
    const patch: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) patch[key] = body[key];
    }
    const result = await client.patch(id).set(patch).commit();
    return NextResponse.json({ id: result._id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
