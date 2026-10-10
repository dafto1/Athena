// Upload dialog / form component (REQ-RES-001, REQ-RES-002, REQ-RES-008)
"use client";

import { useState } from "react";
import { Button, Field, Input, Select, ErrorBanner } from "@/components/ui";
import {
  SUPPORTED_FILE_TYPES,
  MAX_FILE_SIZE_BYTES,
  formatBytes,
} from "./types";
import { UploadCloud } from "lucide-react";

export function ResourceUploadForm({
  onSuccess,
  onCancel,
  categories,
  initialCategory,
}: {
  onSuccess: () => void;
  onCancel: () => void;
  categories: string[];
  initialCategory: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(initialCategory);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const acceptedExtensions = Object.values(SUPPORTED_FILE_TYPES).join(",");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError("");
    const selected = e.target.files?.[0];
    if (!selected) {
      setFile(null);
      return;
    }

    // Client-side validation: size (REQ-RES-002, REQ-RES-008)
    if (selected.size > MAX_FILE_SIZE_BYTES) {
      setError(
        `File size (${formatBytes(selected.size)}) exceeds the maximum allowed limit of 10MB.`
      );
      setFile(null);
      return;
    }

    // Client-side validation: extension
    const ext = "." + selected.name.split(".").pop()?.toLowerCase();
    const isValidExt = Object.values(SUPPORTED_FILE_TYPES).includes(ext);
    if (!isValidExt) {
      setError(
        `Unsupported file type "${ext}". Supported types: PDF, DOC, DOCX, PPT, PPTX, TXT, MD, PNG, JPG.`
      );
      setFile(null);
      return;
    }

    setFile(selected);
    if (!title) {
      const baseName = selected.name.replace(/\.[^/.]+$/, "");
      setTitle(baseName);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      formData.append("category", category);

      const res = await fetch("/api/resources", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Upload failed. Please try again.");
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <ErrorBanner message={error} onDismiss={() => setError("")} />}

      <Field label="Resource File" required>
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 p-6 transition hover:border-stone-400">
          <UploadCloud className="h-8 w-8 text-stone-500" />
          <p className="mt-2 text-xs font-semibold text-slate-700">
            {file ? file.name : "Click or browse to choose academic resource"}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            PDF, Word, PowerPoint, Text, Markdown, Images up to 10MB
          </p>
          <input
            type="file"
            accept={acceptedExtensions}
            onChange={handleFileChange}
            className="mt-3 block text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-stone-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-stone-700 hover:file:bg-stone-100"
          />
        </div>
      </Field>

      <Field label="Title / Description">
        <Input
          type="text"
          placeholder="e.g. Unit 3 Database Slides"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
        />
      </Field>

      <Field label="Category / Folder">
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {!categories.includes(category) && <option value={category}>{category}</option>}
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </Select>
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={loading || !file}>
          {loading ? "Uploading…" : "Upload Resource"}
        </Button>
      </div>
    </form>
  );
}
