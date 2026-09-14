"use client"; 

import Link from "next/link"; 
import { signOut } from "next-auth/react"; 
import { usePathname } from "next/navigation"; 

const links = [
  {
    href : '/dashboard' , label : "Overview" 
  }, 
  {
    href : '/dashboard/tasks' , label : "Tasks"
  }, 
  {
    href : '/dashboard/timer' , label : 'Focus Timer'
  }
]

export function Sidebar() { 
  const pathname = usePathname(); 
  return ( 
    <aside className="flex min-h-screen w-56 flex-col bg-slate-950 p-5 text-slate-100" >
      <Link href="/dashboard" className="text-xl font-bold">Athena</Link>
      <nav className="mt-8 space-y-1">
        {
          links.map((link) => (
            <Link key={link.href} href={link.href} className={`block rounded-lg px-3 py-2 ${pathname === link.href ? "bg-indigo-600" : "hover:bg-slate-800"}`}>
              {link.label}
            </Link>
          ))
        }
      </nav>
      <button onClick={() => signOut({ callbackUrl: "/" })} className="mt-auto rounded-lg border border-slate-700 px-3 py-2 text-left hover:bg-slate-800">
        Log out 
      </button>
    </aside>
  )
}


