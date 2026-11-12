import type { ProjectFile } from "@/src/db";

const kb = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
const kind = (t: string) =>
  t === "application/pdf" ? "PDF" : t.includes("presentation") ? "Slides" : t.includes("wordprocessing") ? "Word" : t.split("/")[1]?.toUpperCase() ?? "File";

/** Evidence attached to a project: image thumbnails first, then documents. Files are served through /api/evidence/[id]. */
export default function EvidenceFiles({ files, remove }: { files: ProjectFile[]; remove?: (fd: FormData) => Promise<void> }) {
  if (!files.length) return null;
  const images = files.filter((f) => f.contentType.startsWith("image/"));
  const docs = files.filter((f) => !f.contentType.startsWith("image/"));
  return (
    <div className="evidence">
      {images.length > 0 && (
        <div className="evidence-thumbs">
          {images.map((f) => (
            <figure key={f.id}>
              <a href={`/api/evidence/${f.id}`} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/evidence/${f.id}`} alt={f.name} loading="lazy" />
              </a>
              {remove && <RemoveButton id={f.id} name={f.name} remove={remove} />}
            </figure>
          ))}
        </div>
      )}
      {docs.map((f) => (
        <div key={f.id} className="evidence-doc">
          <span className="chip blue">{kind(f.contentType)}</span>
          <a href={`/api/evidence/${f.id}`} target="_blank" rel="noopener noreferrer" className="linkish">{f.name}</a>
          <span className="dim">{kb(f.size)}</span>
          {remove && <RemoveButton id={f.id} name={f.name} remove={remove} />}
        </div>
      ))}
    </div>
  );
}

function RemoveButton({ id, name, remove }: { id: string; name: string; remove: (fd: FormData) => Promise<void> }) {
  return (
    <form action={remove}>
      <input type="hidden" name="id" value={id} />
      <button className="evidence-x" aria-label={`Remove ${name}`} title="Remove file">×</button>
    </form>
  );
}
