import { NextRequest, NextResponse } from "next/server";
import { getWriteClient } from "@src/lib/sanity/client";

interface UploadBody {
  /** hash → base64-encoded WebP */
  images: Record<string, string>;
}

/**
 * POST /api/cloud/upload-images
 * Receives a map of { hash: base64WebP }, uploads each to Sanity Assets,
 * returns { urls: { hash: cdnUrl } }.
 */
export async function POST(req: NextRequest) {
  try {
    const { images } = (await req.json()) as UploadBody;
    const client = getWriteClient();

    const urls: Record<string, string> = {};

    await Promise.all(
      Object.entries(images).map(async ([hash, b64]) => {
        const buffer = Buffer.from(b64, "base64");
        const asset = await client.assets.upload("image", buffer, {
          filename: `bls-export-${hash.slice(0, 12)}.webp`,
          contentType: "image/webp",
        });
        urls[hash] = asset.url;
      }),
    );

    return NextResponse.json({ urls });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cloud/upload-images]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
