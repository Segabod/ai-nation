import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { and, count, eq } from "drizzle-orm";
import { db, projects, projectFiles } from "@/src/db";
import { getCurrentUser, verificationError } from "@/src/lib/auth";
import { EVIDENCE_MAX_BYTES, EVIDENCE_MAX_FILES, EVIDENCE_TYPES, uploadsEnabled, validEvidencePath } from "@/src/lib/evidence";

/** Issues short-lived upload tokens so the browser sends files straight to Vercel Blob. */
export async function POST(request: Request) {
  if (!uploadsEnabled()) return NextResponse.json({ error: "File uploads aren’t switched on yet." }, { status: 503 });
  const body = (await request.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const user = await getCurrentUser();
        if (!user || user.role !== "BUILDER") throw new Error("Sign in as a builder to add evidence.");
        const unverified = verificationError(user);
        if (unverified) throw new Error(unverified);
        const projectId = String(JSON.parse(clientPayload || "{}").projectId || "");
        const proj = await db.query.projects.findFirst({ where: and(eq(projects.id, projectId), eq(projects.userId, user.id)), columns: { id: true } });
        if (!proj) throw new Error("That project isn’t yours.");
        if (!validEvidencePath(pathname, user.id, projectId)) throw new Error("Invalid file path.");
        const [{ n }] = await db.select({ n: count() }).from(projectFiles).where(eq(projectFiles.projectId, projectId));
        if (n >= EVIDENCE_MAX_FILES) throw new Error(`A project can hold up to ${EVIDENCE_MAX_FILES} files. Remove one first.`);
        return {
          allowedContentTypes: EVIDENCE_TYPES,
          maximumSizeInBytes: EVIDENCE_MAX_BYTES,
          addRandomSuffix: true,
          validUntil: Date.now() + 10 * 60 * 1000,
        };
      },
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Upload refused." }, { status: 400 });
  }
}
