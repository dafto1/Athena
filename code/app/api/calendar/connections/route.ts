import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Lists connection status for the authenticated user without returning credentials. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sign in to view calendar connections." }, { status: 401 });

  const connections = await prisma.calendarConnection.findMany({
    where: { userId: user.id },
    select: { provider: true, connectedAt: true },
  });
  return NextResponse.json(connections);
}
