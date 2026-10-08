import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOwnedResource } from "@/lib/resources";
import { annotationBulkSchema } from "@/lib/validations/annotation";

/** REQ-PDF-007: Load annotations for a document the student owns. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

  const { id } = await params;
  const resource = await getOwnedResource(user.id, id);
  if (!resource) {
    return NextResponse.json({ message: "Resource not found" }, { status: 404 });
  }

  const annotations = await prisma.annotation.findMany({
    where: { resourceId: id, userId: user.id },
    orderBy: [{ pageNumber: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(annotations);
}

/** REQ-PDF-006 / REQ-PDF-007: Persist new annotations against this document. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

  const { id } = await params;
  const resource = await getOwnedResource(user.id, id);
  if (!resource) {
    return NextResponse.json({ message: "Resource not found" }, { status: 404 });
  }

  const parsed = annotationBulkSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid annotation data." },
      { status: 400 }
    );
  }

  const created = await prisma.$transaction(
    parsed.data.items.map((item) =>
      prisma.annotation.create({
        data: {
          ...item,
          content: item.content ?? null,
          resourceId: id,
          userId: user.id,
        },
      })
    )
  );

  return NextResponse.json(created, { status: 201 });
}
