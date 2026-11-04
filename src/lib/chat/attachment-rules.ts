/**
 * Attachment rules shared with the admin panel (keep in sync with
 * tnboard/src/lib/applicants/attachment-rules.ts). Client-safe.
 */

export const ATTACHMENT_BUCKET = "applicant-attachments";
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const MAX_ATTACHMENTS_PER_MESSAGE = 5;
/** Signed download links stay valid this long; the UI re-fetches messages on reload. */
export const ATTACHMENT_URL_SECONDS = 60 * 60;

export const ALLOWED_ATTACHMENT_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "text/plain": "txt",
  "text/csv": "csv",
  "application/zip": "zip",
};

/** `accept` attribute for the file picker. */
export const ATTACHMENT_ACCEPT = Object.keys(ALLOWED_ATTACHMENT_TYPES).join(",");

export const isAllowedAttachmentType = (type: string) => type in ALLOWED_ATTACHMENT_TYPES;
export const isImageAttachment = (type: string) => type.startsWith("image/");

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Validates a picked set of files; returns a human-readable problem or null. */
export function validateAttachmentFiles(files: { name: string; size: number; type: string }[]): string | null {
  if (files.length > MAX_ATTACHMENTS_PER_MESSAGE) return `You can attach up to ${MAX_ATTACHMENTS_PER_MESSAGE} files per message.`;
  for (const f of files) {
    if (!isAllowedAttachmentType(f.type)) return `"${f.name}" is not a supported file type. Images, PDF, Office documents, text, CSV and ZIP files are allowed.`;
    if (f.size > MAX_ATTACHMENT_BYTES) return `"${f.name}" is larger than ${formatBytes(MAX_ATTACHMENT_BYTES)}.`;
    if (f.size === 0) return `"${f.name}" is empty.`;
  }
  return null;
}

/** Keeps a file name readable but safe inside a storage path. */
export const safeFileName = (name: string) =>
  name
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "file";
