import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Attachment } from "@/lib/supabase/types";
import { ATTACHMENT_BUCKET, ATTACHMENT_URL_SECONDS, MAX_ATTACHMENT_BYTES, safeFileName, validateAttachmentFiles } from "./attachment-rules";

/*
 * Chat attachments live in a private Supabase Storage bucket shared with the
 * admin panel. Rows only store { path, name, type, size }; download links are
 * signed when messages are served, so nothing is reachable without a session.
 */

let bucketReady: Promise<void> | undefined;

/** Creates the bucket on first use (the panel's migration normally does it). */
function ensureBucket(): Promise<void> {
  if (!bucketReady) {
    bucketReady = (async () => {
      const { error } = await supabaseAdmin().storage.createBucket(ATTACHMENT_BUCKET, { public: false, fileSizeLimit: MAX_ATTACHMENT_BYTES });
      if (error && !/already exists|duplicate/i.test(error.message)) {
        bucketReady = undefined;
        throw error;
      }
    })();
  }
  return bucketReady;
}

/** Picks the uploaded files out of a form submission. */
export function filesFromForm(formData: FormData, field = "files"): File[] {
  return formData.getAll(field).filter((v): v is File => typeof v === "object" && v !== null && "arrayBuffer" in v && (v as File).size > 0);
}

/** Validates and uploads files for one conversation; returns the stored references. */
export async function uploadAttachments(conversationId: string, files: File[]): Promise<Attachment[]> {
  if (!files.length) return [];
  const problem = validateAttachmentFiles(files);
  if (problem) throw new Error(problem);
  await ensureBucket();
  const storage = supabaseAdmin().storage.from(ATTACHMENT_BUCKET);
  const stored: Attachment[] = [];
  for (const file of files) {
    const path = `${conversationId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
    const { error } = await storage.upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: false });
    if (error) {
      await removeAttachments(stored.map((a) => a.path)).catch(() => undefined);
      throw new Error(`Could not upload "${file.name}": ${error.message}`);
    }
    stored.push({ path, name: file.name, type: file.type, size: file.size });
  }
  return stored;
}

/** Adds short-lived signed download links to every attachment in the given messages. */
export async function signAttachments<T extends { attachments: Attachment[] }>(rows: T[]): Promise<T[]> {
  const paths = rows.flatMap((r) => (Array.isArray(r.attachments) ? r.attachments.map((a) => a.path) : []));
  if (!paths.length) return rows.map((r) => ({ ...r, attachments: Array.isArray(r.attachments) ? r.attachments : [] }));
  const { data, error } = await supabaseAdmin().storage.from(ATTACHMENT_BUCKET).createSignedUrls(paths, ATTACHMENT_URL_SECONDS);
  if (error) {
    console.error("[attachments] signing failed", error);
    return rows;
  }
  const urls = new Map(data.map((d) => [d.path, d.signedUrl]));
  return rows.map((r) => ({
    ...r,
    attachments: (Array.isArray(r.attachments) ? r.attachments : []).map((a) => ({ ...a, url: urls.get(a.path) ?? undefined })),
  }));
}

export async function removeAttachments(paths: string[]): Promise<void> {
  if (!paths.length) return;
  const { error } = await supabaseAdmin().storage.from(ATTACHMENT_BUCKET).remove(paths);
  if (error) console.error("[attachments] removal failed", error);
}
