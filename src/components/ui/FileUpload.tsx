"use client";

import React, { useCallback, useRef, useState } from "react";
import {
  Paperclip,
  X,
  Upload,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { api, AttachmentMeta } from "@/lib/api";

/* ── Constants ─────────────────────────────────────────────────────────── */

const ALLOWED_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".pdf",
  ".txt",
  ".log",
  ".json",
  ".csv",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_FILES = 3;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mime: string) {
  if (mime.startsWith("image/")) return ImageIcon;
  return FileText;
}

function getExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot).toLowerCase() : "";
}

/* ── Types ─────────────────────────────────────────────────────────────── */

interface PendingFile {
  file: File;
  status: "uploading" | "done" | "error";
  meta?: AttachmentMeta;
  error?: string;
}

interface FileUploadProps {
  /** Already-uploaded attachments (controlled) */
  attachments: AttachmentMeta[];
  /** Called when the list changes (add / remove) */
  onChange: (attachments: AttachmentMeta[]) => void;
  /** Disable interactions while feedback is submitting */
  disabled?: boolean;
}

/* ── Component ─────────────────────────────────────────────────────────── */

export default function FileUpload({
  attachments,
  onChange,
  disabled = false,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalCount =
    attachments.length + pending.filter((p) => p.status === "uploading").length;

  /* ── upload logic ─────────────────────────────────────────────────── */

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      setError(null);
      const fileArray = Array.from(files);

      // Enforce max count
      const remaining = MAX_FILES - attachments.length;
      if (remaining <= 0) {
        setError(`Maximum ${MAX_FILES} files allowed`);
        return;
      }
      const batch = fileArray.slice(0, remaining);

      // Validate each file before uploading
      for (const f of batch) {
        const ext = getExtension(f.name);
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
          setError(`File type '${ext}' is not allowed`);
          return;
        }
        if (f.size > MAX_FILE_SIZE) {
          setError(`${f.name} exceeds ${formatBytes(MAX_FILE_SIZE)} limit`);
          return;
        }
      }

      // Create pending entries
      const newPending: PendingFile[] = batch.map((file) => ({
        file,
        status: "uploading" as const,
      }));
      setPending((prev) => [...prev, ...newPending]);

      // Upload in parallel
      const results = await Promise.allSettled(
        batch.map(async (file, i) => {
          try {
            const meta = await api.uploadAttachment(file);
            setPending((prev) =>
              prev.map((p) =>
                p.file === file ? { ...p, status: "done" as const, meta } : p,
              ),
            );
            return meta;
          } catch (err) {
            const msg = err instanceof Error ? err.message : "Upload failed";
            setPending((prev) =>
              prev.map((p) =>
                p.file === file
                  ? { ...p, status: "error" as const, error: msg }
                  : p,
              ),
            );
            throw err;
          }
        }),
      );

      // Collect successful uploads and propagate
      const successful = results
        .filter(
          (r): r is PromiseFulfilledResult<AttachmentMeta> =>
            r.status === "fulfilled",
        )
        .map((r) => r.value);

      if (successful.length > 0) {
        onChange([...attachments, ...successful]);
      }

      // Clean up done/error entries after a brief delay
      setTimeout(() => {
        setPending((prev) => prev.filter((p) => p.status === "uploading"));
      }, 2000);
    },
    [attachments, onChange],
  );

  /* ── drag & drop ──────────────────────────────────────────────────── */

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (disabled) return;
      if (e.dataTransfer.files.length > 0) {
        uploadFiles(e.dataTransfer.files);
      }
    },
    [disabled, uploadFiles],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  /* ── file picker ──────────────────────────────────────────────────── */

  const handleClick = () => {
    if (!disabled && totalCount < MAX_FILES) inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(e.target.files);
    }
    // Reset so same file can be re-selected
    e.target.value = "";
  };

  /* ── remove ───────────────────────────────────────────────────────── */

  const removeAttachment = (id: string) => {
    onChange(attachments.filter((a) => a.id !== id));
  };

  /* ── render ───────────────────────────────────────────────────────── */

  return (
    <div className="space-y-3">
      <label className="text-xs uppercase tracking-wide text-neutral-500">
        Attachments{" "}
        <span className="normal-case text-neutral-600">
          (optional &middot; max {MAX_FILES} files &middot;{" "}
          {formatBytes(MAX_FILE_SIZE)} each)
        </span>
      </label>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        className={`
          flex cursor-pointer flex-col items-center justify-center gap-2
          rounded-xl border border-dashed px-4 py-6 text-center transition-colors
          ${dragOver ? "border-primary-500 bg-primary-500/5" : "border-neutral-800 hover:border-neutral-600"}
          ${disabled ? "pointer-events-none opacity-50" : ""}
          ${totalCount >= MAX_FILES ? "pointer-events-none opacity-40" : ""}
        `}
      >
        <Upload size={20} className="text-neutral-500" />
        <p className="text-sm text-neutral-400">
          {totalCount >= MAX_FILES ? (
            "Maximum files reached"
          ) : (
            <>
              Drag &amp; drop or{" "}
              <span className="text-primary-400 underline underline-offset-2">
                browse
              </span>
            </>
          )}
        </p>
        <p className="text-xs text-neutral-600">
          PNG, JPG, PDF, TXT, LOG, JSON, CSV
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ALLOWED_EXTENSIONS.join(",")}
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-400">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* File list */}
      {(attachments.length > 0 || pending.length > 0) && (
        <ul className="space-y-2">
          {/* Completed uploads */}
          {attachments.map((a) => {
            const Icon = getFileIcon(a.type);
            return (
              <li
                key={a.id}
                className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900/50 px-3 py-2"
              >
                <Icon size={16} className="shrink-0 text-neutral-400" />
                <span className="min-w-0 flex-1 truncate text-sm text-neutral-300">
                  {a.name}
                </span>
                <span className="shrink-0 text-xs text-neutral-600">
                  {formatBytes(a.size)}
                </span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeAttachment(a.id);
                    }}
                    className="shrink-0 rounded p-1 text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-red-400"
                  >
                    <X size={14} />
                  </button>
                )}
              </li>
            );
          })}

          {/* In-progress / error uploads */}
          {pending.map((p, i) => (
            <li
              key={`pending-${i}`}
              className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900/50 px-3 py-2"
            >
              {p.status === "uploading" ? (
                <Loader2
                  size={16}
                  className="shrink-0 animate-spin text-primary-400"
                />
              ) : p.status === "error" ? (
                <AlertCircle size={16} className="shrink-0 text-red-400" />
              ) : (
                <Paperclip size={16} className="shrink-0 text-green-400" />
              )}
              <span className="min-w-0 flex-1 truncate text-sm text-neutral-300">
                {p.file.name}
              </span>
              {p.status === "uploading" && (
                <span className="shrink-0 text-xs text-neutral-500">
                  Uploading...
                </span>
              )}
              {p.status === "error" && (
                <span className="shrink-0 text-xs text-red-400">{p.error}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
