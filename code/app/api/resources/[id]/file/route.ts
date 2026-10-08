import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse("Unauthorised", { status: 401 });
  }

  const { id } = await params;
  const resource = await prisma.resource.findFirst({
    where: { id, userId: user.id },
    select: {
      fileName: true,
      fileType: true,
      fileSize: true,
      fileData: true,
    },
  });

  if (!resource || !resource.fileData) {
    return new NextResponse("Resource file not found", { status: 404 });
  }

  // Stream binary file data directly from Neon Postgres
  return new NextResponse(resource.fileData, {
    status: 200,
    headers: {
      "Content-Type": resource.fileType || "application/octet-stream",
      "Content-Length": String(resource.fileSize),
      "Content-Disposition": `inline; filename="${encodeURIComponent(resource.fileName)}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
