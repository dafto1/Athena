import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sign in to choose a resource." }, { status: 401 });

  const resources = await prisma.resource.findMany({
    where: { userId: user.id },
    select: { id: true, title: true, fileName: true, fileType: true },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(resources, { headers: { "Cache-Control": "private, no-store" } });
}
