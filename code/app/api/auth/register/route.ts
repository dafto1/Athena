import bcrypt from "bcryptjs"; 
import { NextResponse } from "next/server"; 
import { prisma } from "@/lib/prisma" 
import { registerSchema } from "@/lib/validations/auth"; 
export async function POST(request: Request) { 
  const body = await request.json(); 
  const parsed = registerSchema.safeParse(body); 

  if (!parsed.success) { 
    return NextResponse.json({ message: "Please correct the form  fields. " }, { status: 400 }); 
  } 

  const existingUser = await prisma.user.findUnique({
    where : {email : parsed.data.email}
  })

  if (existingUser) { 
    return NextResponse.json({ message: "An account already uses this email. " }, { status: 409 }) 
    
  } 
  const passwordHash = await bcrypt.hash(parsed.data.password, 12); 
  await prisma.user.create({
    data: { name: parsed.data.name, email: parsed.data.email, passwordHash },
  }); 
  return NextResponse.json({ message: "Account created. " }, { status: 201 }); 
}