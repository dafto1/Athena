"use client";

import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Timer,
} from "lucide-react";

const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/tasks", label: "Tasks", iconSrc: "/figma/todo.svg" },
  { href: "/dashboard/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/dashboard/timer", label: "Focus Timer", icon: Timer },
  { href: "/dashboard/resources", label: "Resources", iconSrc: "/figma/file.svg" },
  { href: "/dashboard/groups", label: "Study Groups", iconSrc: "/figma/groups.svg" },
];

/** Renders the dashboard navigation for the authenticated user. */
export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`mx-3 mt-3 rounded-2xl border border-[#e9e8e4] bg-[#f7f6f3] text-[#37352f] shadow-sm lg:sticky lg:top-4 lg:mx-4 lg:mr-0 lg:flex lg:h-[calc(100vh-2rem)] lg:shrink-0 lg:flex-col lg:transition-[width] lg:duration-200 ${
        collapsed ? "lg:w-[4.5rem]" : "lg:w-60"
      }`}
    >
      <div className={`px-4 py-4 lg:pt-5 ${collapsed ? "lg:px-2" : ""}`}>
        <div className={`flex items-center ${collapsed ? "lg:flex-col lg:gap-3" : "justify-between"}`}>
          <Link href="/dashboard" aria-label="Athena home" className="text-xl font-bold tracking-tight">
            {collapsed ? <>A<span className="text-stone-400">.</span></> : <>Athena<span className="text-stone-400">.</span></>}
          </Link>
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden h-8 w-8 shrink-0 place-items-center rounded-lg text-[#787774] transition hover:bg-[#eeedea] hover:text-[#37352f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b9a97] lg:grid"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" aria-hidden="true" /> : <ChevronLeft className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
        {!collapsed && <p className="hidden pt-2 text-xs text-[#787774] lg:block">Workspace</p>}
      </div>

      <nav aria-label="Dashboard" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:block lg:space-y-1 lg:px-2">
        {links.map((link) => {
          const active =
            pathname === link.href ||
            (link.href !== "/dashboard" && pathname.startsWith(`${link.href}/`));
          const Icon = "icon" in link ? link.icon : null;
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-label={link.label}
              title={collapsed ? link.label : undefined}
              className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                collapsed ? "lg:justify-center lg:px-2" : ""
              } ${
                active
                  ? "bg-[#e9e8e4] text-[#37352f]"
                  : "text-[#5f5e5b] hover:bg-[#eeedea] hover:text-[#37352f]"
              }`}
            >
              {"iconSrc" in link ? (
                <Image src={link.iconSrc} alt="" width={16} height={16} className="h-4 w-4 shrink-0 opacity-70" unoptimized />
              ) : Icon ? (
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              ) : null}
              <span className={collapsed ? "lg:hidden" : ""}>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        aria-label="Log out"
        title={collapsed ? "Log out" : undefined}
        className={`m-3 flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[#5f5e5b] transition hover:bg-[#eeedea] hover:text-[#37352f] lg:mt-auto ${
          collapsed ? "lg:justify-center lg:px-2" : ""
        }`}
      >
        <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className={collapsed ? "lg:hidden" : ""}>Log out</span>
      </button>
    </aside>
  );
}
