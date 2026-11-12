import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { get } from "@vercel/blob";
import { db, projectFiles } from "@/src/db";
import { getCurrentUser } from "@/src/lib/auth";
import { blobAccess } from "@/src/lib/evidence";

export const dynamic = "force-dynamic";

/**
 * Streams an evidence file to people allowed to see the builder's passport:
 * the builder, organisations and admins (the same rule as /talent/[id]).
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await getCurrentUser();
  if (!viewer) return new NextResponse("Sign in to view this file.", { status: 401 });
  const { id } = await params;
  const file = await db.query.projectFiles.findFirst({ where: eq(projectFiles.id, id) });
  const allowed = file && (viewer.id === file.userId || viewer.role === "ORGANISATION" || viewer.role === "ADMIN");
  if (!file || !allowed) return new NextResponse("Not found.", { status: 404 });

  const blob = await get(file.url, { access: blobAccess() });
  if (!blob || blob.statusCode !== 200) return new NextResponse("Not found.", { status: 404 });
  const download = new URL(req.url).searchParams.has("download") || !file.contentType.startsWith("image/") && file.contentType !== "application/pdf";
  const safeName = file.name.replace(/[^\w.\- ]+/g, "_");
  return new NextResponse(blob.stream, {
    headers: {
      "Content-Type": file.contentType,
      "Content-Length": String(file.size),
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${safeName}"`,
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
      // images can't carry scripts this way; PDFs open in the browser's own viewer
      ...(file.contentType.startsWith("image/") ? { "Content-Security-Policy": "default-src 'none'; img-src 'self'; sandbox" } : {}),
    },
  });
}
