import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; 
import { taskSchema } from "@/lib/validations/task"; 
import { requireUser } from "@/lib/auth"; 

export async function GET() { 
  const user = await requireUser(); 
  const tasks = await prisma.task.findMany({
    where: { userId: user.id },
    orderBy: [{ completed: "asc" }, { dueDate: 'asc' }]
  });  
  return NextResponse.json(tasks); 
}  

export async function POST(request: Request) { 
  const user = await requireUser(); 
  const parsed = taskSchema.safeParse(await request.json());  
  if (!parsed.success) { 
    return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 }); 
  } 
  const task = await prisma.task.create({
    data: {
      ...parsed.data,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      userId: user.id
    }
  }); 
 return NextResponse.json(task , {status : 201})  
} 