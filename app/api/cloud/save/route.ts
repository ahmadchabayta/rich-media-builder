import { NextRequest, NextResponse } from "next/server";
import { getWriteClient } from "@src/lib/sanity/client";
import type { ProjectSnapshot } from "@src/store/quizStore";

const PLACEHOLDER_PREFIX = "bls-img://";

interface SaveBody {
  id?: string; // existing document id for updates
  meta: {
    title: string;
    status?: string;
    format?: string;
    client?: string;
    notes?: string;
    publishDate?: string;
    endDate?: string;
    platforms?: string[];
    tags?: string[];
    audience?: Record<string, unknown>;
  };
  snapshot: ProjectSnapshot;
  /** hash → base64-encoded WebP string */
  images: Record<string, string>;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SaveBody;
    const { id, meta, snapshot, images } = body;

    const client = getWriteClient();

    // 1. Upload each image blob to Sanity Assets
    const hashToAsset: Record<string, { _ref: string; url: string }> = {};

    await Promise.all(
      Object.entries(images).map(async ([hash, b64]) => {
        const buffer = Buffer.from(b64, "base64");
        const asset = await client.assets.upload("image", buffer, {
          filename: `bls-${hash.slice(0, 12)}.webp`,
          contentType: "image/webp",
        });
        hashToAsset[hash] = {
          _ref: asset._id,
          url: asset.url,
        };
      }),
    );

    // 2. Replace placeholders in snapshot with CDN URLs
    const snapshotStr = JSON.stringify(snapshot).replace(
      new RegExp(
        `${PLACEHOLDER_PREFIX.replace("://", ":\\/\\/")}([a-f0-9]+)`,
        "g",
      ),
      (_, hash: string) => hashToAsset[hash]?.url ?? "",
    );

    // 3. Build previewImages from every uploaded asset (visible in Studio)
    const previewImages = Object.values(hashToAsset).map((asset, i) => ({
      _type: "image",
      _key: `img-${i}`,
      asset: { _type: "reference", _ref: asset._ref },
    }));

    // 4. Upsert the adProject document
    const docId = id ?? `adProject-${Date.now()}`;
    const parsedSnap: ProjectSnapshot = JSON.parse(snapshotStr);

    const doc = {
      _type: "adProject",
      _id: docId,
      ...meta,
      adSizeW: parsedSnap.defaultW,
      adSizeH: parsedSnap.defaultH,
      snapshotVersion: parsedSnap.version ?? 1,
      snapshotJson: snapshotStr,
      ...(previewImages.length > 0 ? { previewImages } : {}),
    };

    const result = await client.createOrReplace(doc);

    return NextResponse.json({ id: result._id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cloud/save]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
