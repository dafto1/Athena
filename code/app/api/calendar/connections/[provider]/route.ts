import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { invalidateCalendarSyncCache, normalizeProvider } from "@/lib/calendar";
import { prisma } from "@/lib/prisma";

/** Disconnects the authenticated user's calendar for one supported provider. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sign in to disconnect a calendar." }, { status: 401 });
  const { provider: rawProvider } = await params;
  const provider = normalizeProvider(rawProvider);
  if (!provider) return NextResponse.json({ message: "Unsupported calendar provider." }, { status: 404 });

  await prisma.calendarConnection.deleteMany({ where: { userId: user.id, provider } });
  invalidateCalendarSyncCache(user.id);
  return NextResponse.json({ success: true });
}
