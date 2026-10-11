import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const conversation = await prisma.nemoConversation.findFirst({
    where: { id, userId: user.id },
    include: { messages: { orderBy: { createdAt: "asc" }, take: 100 } },
  });
  if (!conversation) return NextResponse.json({ message: "Conversation not found." }, { status: 404 });
  return NextResponse.json(conversation, { headers: { "Cache-Control": "private, no-store" } });
}
