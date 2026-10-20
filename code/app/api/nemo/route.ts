import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { runNemo } from "@/lib/nemo";

const requestSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  history: z.array(z.object({ role: z.enum(["user", "nemo"]), text: z.string().trim().min(1).max(2000) })).max(20).default([]),
  context: z.object({ resourceId: z.string().cuid().optional(), resourceTitle: z.string().max(200).optional() }).optional(),
});
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sign in to use Nemo." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: "Send a message between 1 and 2000 characters." }, { status: 400 });
  try { return NextResponse.json(await runNemo(user.id, parsed.data.message, parsed.data.history, parsed.data.context)); }
  catch (error) { console.error("Nemo request failed:", error); return NextResponse.json({ message: "Nemo could not complete that request." }, { status: 500 }); }
}
