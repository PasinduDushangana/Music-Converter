import { NextRequest, NextResponse } from "next/server";
import { fetchMedia, MediaError } from "@/lib/media-url";
export const runtime = "nodejs";
const buckets = new Map<string, { count: number; expires: number }>();
export async function POST(request: NextRequest) {
  const key =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "anonymous";
  const now = Date.now();
  if (buckets.size > 10000)
    for (const [k, v] of buckets) if (v.expires < now) buckets.delete(k);
  const bucket = buckets.get(key);
  if (bucket && bucket.expires > now && bucket.count >= 12)
    return NextResponse.json(
      { error: "Too many URL requests. Try again in a few minutes." },
      { status: 429 },
    );
  buckets.set(key, {
    count: bucket && bucket.expires > now ? bucket.count + 1 : 1,
    expires: bucket && bucket.expires > now ? bucket.expires : now + 5 * 60_000,
  });
  try {
    if (Number(request.headers.get("content-length") || 0) > 4096)
      throw new MediaError("Request is too large.", 413);
    const body = await request.json();
    if (typeof body.url !== "string" || body.url.length > 2048)
      throw new MediaError("Enter a valid direct media URL.");
    const result = await fetchMedia(body.url);
    return new NextResponse(new Uint8Array(result.data), {
      headers: {
        "Content-Type": result.contentType,
        "Content-Length": String(result.data.length),
        "X-Media-Name": encodeURIComponent(result.basename),
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    const error =
      e instanceof MediaError
        ? e
        : new MediaError(
            "Could not fetch this media file. Check the direct link and its access permissions.",
            422,
          );
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }
}
