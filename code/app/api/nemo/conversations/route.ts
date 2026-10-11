import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const conversations = await prisma.nemoConversation.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, updatedAt: true },
    take: 50,
  });
  return NextResponse.json(conversations, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const conversation = await prisma.nemoConversation.create({ data: { userId: user.id } });
  return NextResponse.json(conversation, { status: 201 });
}
