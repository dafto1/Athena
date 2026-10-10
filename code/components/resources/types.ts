// Types and constants for Resource Management (REQ-RES-001 - REQ-RES-008)

export type Resource = {
  id: string;
  title: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
};

export const RESOURCE_CATEGORIES = ["General"] as const;

export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number];

// Supported MIME types and extensions
export const SUPPORTED_FILE_TYPES: Record<string, string> = {
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.ms-powerpoint": ".ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
  "text/plain": ".txt",
  "text/markdown": ".md",
  "image/png": ".png",
  "image/jpeg": ".jpg",
};

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

export function formatBytes(bytes: number, decimals = 1) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
