import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";

const PATH_RE = /^\/[a-z0-9/-]{0,120}$/;

/** Called by the API after admin edits (content, prices, theme) so ISR pages refresh immediately. */
export async function POST(request: NextRequest): Promise<NextResponse> {
    const secret = process.env.REVALIDATE_SECRET;
    const given = request.headers.get("x-revalidate-secret") ?? "";
    if (!secret || given.length !== secret.length || !timingSafeEqual(Buffer.from(given), Buffer.from(secret))) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    const body: unknown = await request.json().catch(() => null);
    const paths = typeof body === "object" && body !== null && Array.isArray((body as { paths?: unknown }).paths) ? (body as { paths: unknown[] }).paths : [];
    const valid = paths.filter((p): p is string => typeof p === "string" && PATH_RE.test(p)).slice(0, 20);
    for (const p of valid) revalidatePath(p, "layout");
    return NextResponse.json({ revalidated: valid });
}
