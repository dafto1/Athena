import { z } from "zod";

export const createGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Group name is required")
    .max(60, "Group name must be 60 characters or fewer"),
  description: z
    .string()
    .trim()
    .max(200, "Description must be 200 characters or fewer")
    .optional(),
});

export const joinGroupSchema = z.object({
  inviteCode: z
    .string()
    .trim()
    .toUpperCase()
    .min(4, "Invite code must be at least 4 characters")
    .max(20, "Invite code is too long"),
});

export const createFolderSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Folder name is required")
    .max(40, "Folder name must be 40 characters or fewer"),
});

export const shareResourceSchema = z.object({
  resourceId: z.string().min(1, "Resource is required"),
  folderId: z.string().optional().nullable(),
});
