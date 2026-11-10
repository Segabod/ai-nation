// The brand photos live at the repo root (from the original static site).
// Copy them into public/ at build time so Next.js serves them at the same URLs.
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "fs";
mkdirSync("public", { recursive: true });
for (const f of readdirSync(".")) {
  if (/\.(jpe?g|png|webp|svg)$/i.test(f) && !existsSync(`public/${f}`)) {
    copyFileSync(f, `public/${f}`);
    console.log(`copied ${f} -> public/`);
  }
}
