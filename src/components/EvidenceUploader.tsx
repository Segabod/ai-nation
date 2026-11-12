"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { attachEvidence } from "@/app/actions/app";

const ACCEPT = ".png,.jpg,.jpeg,.webp,.gif,.pdf,.pptx,.docx";
const MAX_MB = 10;

type Props = { projectId: string; prefix: string; access: "private" | "public"; remaining: number };

/** Sends files straight from the browser to Vercel Blob, then records them against the project. */
export default function EvidenceUploader({ projectId, prefix, access, remaining }: Props) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    setError(null);
    if (files.length > remaining) {
      setError(remaining === 0 ? "This project already has the most files it can hold." : `You can add ${remaining} more file${remaining === 1 ? "" : "s"} to this project.`);
      return;
    }
    for (const f of files) {
      if (f.size > MAX_MB * 1024 * 1024) { setError(`“${f.name}” is over ${MAX_MB} MB.`); return; }
    }
    try {
      for (const [i, f] of files.entries()) {
        const label = files.length > 1 ? ` (${i + 1} of ${files.length})` : "";
        setBusy(`Uploading ${f.name}${label}…`);
        const safe = f.name.toLowerCase().replace(/[^a-z0-9.\-]+/g, "-").replace(/^-+|-+$/g, "").slice(-80) || "file";
        const blob = await upload(prefix + safe, f, {
          access,
          handleUploadUrl: "/api/evidence/upload",
          clientPayload: JSON.stringify({ projectId }),
          onUploadProgress: ({ percentage }) => setBusy(`Uploading ${f.name}${label}… ${Math.round(percentage)}%`),
        });
        const res = await attachEvidence({ projectId, url: blob.url, pathname: blob.pathname, name: f.name });
        if (res.error) throw new Error(res.error);
      }
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed.";
      setError(/content type|not allowed/i.test(msg) ? "That file type isn’t supported. Use images, PDF, PowerPoint or Word." : msg.replace(/^Vercel Blob: /, ""));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="evidence-up">
      <input ref={input} type="file" accept={ACCEPT} multiple hidden onChange={onPick} aria-label="Add evidence files" />
      <button type="button" className="btn btn-ghost btn-sm" disabled={!!busy || remaining === 0} onClick={() => input.current?.click()}>
        {busy ? "Uploading…" : "Attach files"}
      </button>
      <small className="dim">{busy ?? `Screenshots, PDF, slides or Word, up to ${MAX_MB} MB each. ${remaining} slot${remaining === 1 ? "" : "s"} left.`}</small>
      {error && <p className="notice err" role="alert" style={{ marginTop: 8 }}>{error}</p>}
    </div>
  );
}
