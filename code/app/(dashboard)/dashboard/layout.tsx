import { Sidebar } from "@/components/layout/sidebar";
import { GlobalSearch } from "@/components/layout/global-search";
import { FloatingFocusTimer } from "@/components/timer/floating-focus-timer";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-white lg:flex-row">
      <Sidebar />
      <main className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="z-40 flex h-16 shrink-0 items-center justify-between gap-6 border-b border-[#e9e8e4] bg-white px-4 sm:px-7">
          <div className="hidden min-w-0 text-sm font-semibold text-[#37352f] sm:block">Athena <span className="font-normal text-[#9b9a97]">/ Workspace</span></div>
          <div className="ml-auto w-full max-w-lg"><GlobalSearch /></div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto"><div className="h-full min-h-full pt-8">{children}</div></div>
        <FloatingFocusTimer />
      </main>
    </div>
  );
}
