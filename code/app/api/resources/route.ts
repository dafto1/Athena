import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import {
  MAX_FILE_SIZE_BYTES,
  SUPPORTED_FILE_TYPES,
} from "@/components/resources/types";

// REQ-RES-004: Students can view their stored resources
// REQ-RES-005: Students can organize resources using folders, categories
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const query = searchParams.get("query");

  const whereClause: any = { userId: user.id };
  if (category && category !== "All") {
    whereClause.category = category;
  }
  if (query) {
    whereClause.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { fileName: { contains: query, mode: "insensitive" } },
    ];
  }

  const resources = await prisma.resource.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(resources);
}

// REQ-RES-001: Students can upload supported academic resources
// REQ-RES-002: Athena would validate uploaded files before storing them
// REQ-RES-003: Athena would associate each stored resource with its corresponding student
// REQ-RES-008: Informative error message when an unsupported or invalid file is selected
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const titleInput = formData.get("title") as string | null;
    const categoryInput = (formData.get("category") as string | null) || "General";

    if (!file) {
      return NextResponse.json(
        { message: "No file was selected. Please choose a file to upload." },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          message: `File size exceeds the 10MB limit (Selected size: ${(
            file.size /
            (1024 * 1024)
          ).toFixed(1)}MB).`,
        },
        { status: 400 }
      );
    }

    // Validate file type
    const fileExtension = path.extname(file.name).toLowerCase();
    const isMimeSupported = Boolean(SUPPORTED_FILE_TYPES[file.type]);
    const isExtensionSupported = Object.values(SUPPORTED_FILE_TYPES).includes(
      fileExtension
    );

    if (!isMimeSupported && !isExtensionSupported) {
      return NextResponse.json(
        {
          message: `Unsupported file format '${fileExtension || file.type}'. Supported formats: PDF, DOC/DOCX, PPT/PPTX, TXT, Markdown, PNG, JPG.`,
        },
        { status: 400 }
      );
    }

    const title = (titleInput?.trim() || path.parse(file.name).name).slice(0, 120);

    // Save file locally to public/uploads/resources
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "resources");
    await mkdir(uploadsDir, { recursive: true });

    const uniqueId = crypto.randomUUID();
    const safeFilename = `${uniqueId}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = path.join(uploadsDir, safeFilename);

    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/resources/${safeFilename}`;

    const resource = await prisma.resource.create({
      data: {
        title,
        fileName: file.name,
        fileType: file.type || fileExtension,
        fileSize: file.size,
        fileUrl,
        category: categoryInput.trim().slice(0, 50) || "General",
        userId: user.id, // REQ-RES-003
      },
    });

    return NextResponse.json(resource, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { message: "Failed to upload and store resource. Please try again." },
      { status: 500 }
    );
  }
}
