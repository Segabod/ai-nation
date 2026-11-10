import { z } from "zod";

export type FormState = { error?: string; ok?: string; values?: Record<string, string> };
export const initialState: FormState = {};

export function values(fd: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  fd.forEach((v, k) => {
    if (typeof v === "string" && !k.startsWith("$") && !/password/i.test(k)) out[k] = v;
  });
  return out;
}

export function firstError(err: z.ZodError) {
  const i = err.issues[0];
  return i ? i.message : "Please check the form and try again.";
}

/** Split a comma separated list into trimmed unique values. */
export function list(v: unknown, max = 20) {
  return Array.from(
    new Set(String(v ?? "").split(",").map((s) => s.trim()).filter(Boolean)),
  ).slice(0, max);
}

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address.").max(200);
export const urlSchema = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v === "" || /^https?:\/\/[^\s]+$/i.test(v), "Links must start with http:// or https://");
