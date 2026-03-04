import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/proxy-image?url=<encoded-url>
 *
 * Fetches a remote image server-side (no CORS restrictions) and pipes it back
 * to the browser. Used by the export engine to read Sanity CDN images into
 * a canvas without triggering cross-origin canvas tainting.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  // Only proxy images from trusted origins
  const allowed = [
    "https://cdn.sanity.io/",
    "https://images.unsplash.com/",
    "https://picsum.photos/",
  ];
  if (!allowed.some((prefix) => url.startsWith(prefix))) {
    return NextResponse.json({ error: "URL not allowed" }, { status: 403 });
  }

  try {
    const upstream = await fetch(url, { cache: "force-cache" });
    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream ${upstream.status}` },
        { status: upstream.status },
      );
    }

    const contentType =
      upstream.headers.get("content-type") ?? "application/octet-stream";
    const buffer = await upstream.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
        // Allow the browser to use the response in a canvas
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
