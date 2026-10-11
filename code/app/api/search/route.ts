import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Searches only the signed-in user's resource and task metadata. */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sign in to search Athena." }, { status: 401 });

  const query = new URL(request.url).searchParams.get("query")?.trim() ?? "";
  if (query.length < 2) return NextResponse.json({ resources: [], tasks: [] });
  if (query.length > 120) return NextResponse.json({ message: "Search query is too long." }, { status: 400 });

  const [resources, tasks] = await Promise.all([
    prisma.resource.findMany({
      where: { userId: user.id, OR: [
        { title: { contains: query, mode: "insensitive" } },
        { fileName: { contains: query, mode: "insensitive" } },
        { category: { contains: query, mode: "insensitive" } },
      ] },
      select: { id: true, title: true, fileName: true, category: true, fileType: true },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    prisma.task.findMany({
      where: { userId: user.id, OR: [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ] },
      select: { id: true, title: true, description: true, dueDate: true, completed: true },
      orderBy: [{ completed: "asc" }, { dueDate: "asc" }, { updatedAt: "desc" }],
      take: 6,
    }),
  ]);

  return NextResponse.json({ resources, tasks }, { headers: { "Cache-Control": "private, no-store" } });
}
