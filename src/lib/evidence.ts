import "server-only";

/** Project evidence files: screenshots, slides and write-ups attached to a passport project. */
export const EVIDENCE_TYPES = [
  "image/png", "image/jpeg", "image/webp", "image/gif",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
export const EVIDENCE_MAX_BYTES = 10 * 1024 * 1024;
export const EVIDENCE_MAX_FILES = 6;

/** "private" (default) keeps files behind sign-in; set BLOB_ACCESS=public only if your Blob store is public. */
export const blobAccess = (): "private" | "public" => (process.env.BLOB_ACCESS === "public" ? "public" : "private");
export const uploadsEnabled = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

/** Every file for a project lives under this folder, which the upload route enforces. */
export const evidencePrefix = (userId: string, projectId: string) => `evidence/${userId}/${projectId}/`;

export function validEvidencePath(pathname: string, userId: string, projectId: string) {
  const prefix = evidencePrefix(userId, projectId);
  return pathname.startsWith(prefix) && !pathname.includes("..") && pathname.length < 300 && !pathname.slice(prefix.length).includes("/");
}
