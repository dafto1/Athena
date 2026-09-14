import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar"; 
import { getCurrentUser } from "@/lib/auth"; 

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser(); 
  if (!user) redirect("/login"); 
  return <div className="flex"><Sidebar></Sidebar><main className = "min-h-screen flex-1 p-8">{children}</main> </div>
  
}