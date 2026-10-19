import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { runNemo } from "@/lib/nemo";

const requestSchema = z.object({ message: z.string().trim().min(1).max(2000) });
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sign in to use Nemo." }, { status: 401 });
  try { const parsed = requestSchema.parse(await request.json()); return NextResponse.json(await runNemo(user.id, parsed.message)); }
  catch (error) { console.error("Nemo request failed:", error); return NextResponse.json({ message: error instanceof Error ? error.message : "Nemo could not complete that request." }, { status: 500 }); }
}
