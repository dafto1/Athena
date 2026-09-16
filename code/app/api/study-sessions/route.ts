import { NextResponse } from "next/server"; 
import { z } from "zod"; 
import { getCurrentUser } from "@/lib/auth"; 
import { prisma } from "@/lib/prisma"; 

const studySessionSchema = z.object({
  durationMin: z.number().int().min(1).max(180), 
  startedAt : z.string().datetime() , 
}) 

export async function POST(request: Request) { 
  const user = await getCurrentUser(); 
  if (!user) return NextResponse.json({ message: "Unauthorised" }, { status: 401 }); 
  const parsed = studySessionSchema.safeParse(await request.json()); 
  if (!parsed.success) return NextResponse.json({ message: "Invalid study session. " }, { status: 400 }); 
  const session = await prisma.studySession.create({
    data: { userId: user.id, durationMin: parsed.data.durationMin, startedAt: new Date(parsed.data.startedAt) } ,
  })
  return NextResponse.json(session, { status: 201 }); 
}