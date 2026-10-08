"use client"; 

import Link from "next/link"; 
import { signOut } from "next-auth/react"; 
import { usePathname } from "next/navigation"; 
import { FolderOpen, LayoutDashboard, ListTodo, LogOut, Timer, Users } from "lucide-react";

const links = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard/tasks",
    label: "Tasks",
    icon: ListTodo,
  },
  {
    href: "/dashboard/timer",
    label: "Focus Timer",
    icon: Timer,
  },
  {
    href: "/dashboard/resources",
    label: "Resources",
    icon: FolderOpen,
  },
  {
    href: "/dashboard/groups",
    label: "Study Groups",
    icon: Users,
  },
];

export function Sidebar() { 
  const pathname = usePathname(); 
  return ( 
    <aside className="border-b border-slate-800 bg-slate-950 text-slate-100 lg:flex lg:min-h-screen lg:w-64 lg:flex-col lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between px-5 py-4 lg:block lg:py-7">
        <Link href="/dashboard" className="text-xl font-bold tracking-tight">
          Athena<span className="text-violet-400">.</span>
        </Link>
        <p className="hidden pt-1 text-sm text-slate-400 lg:block">Your focused study space</p>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:block lg:space-y-1 lg:px-3">
        {links.map((link) => {
          const active =
            pathname === link.href ||
            (link.href !== "/dashboard" && pathname.startsWith(`${link.href}/`));
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="m-3 flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white lg:mt-auto"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
        Log out
      </button>
    </aside>
  );
}
