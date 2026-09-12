import { z } from "zod"; 
export const registerSchema = z.object({ 
  name: z.string().trim().min(2, "Name must be atleast 2 characters").max(80), 
  email: z.string().trim().email("Enter a valid email address").toLowerCase(),
  password: z.string().min(8, "Password must be atleast 8 characters").max(72)  

}) 

export const loginSchema = z.object({ 
  email: z.string().trim().email().toLowerCase(), 
  password : z.string().min(1) , 
 })