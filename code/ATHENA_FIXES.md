# Athena repair and redesign guide

This document is based on the current repository, not a generic Next.js checklist. The build is currently failing and the dashboard is blank for identifiable reasons.

## What is broken

| Symptom | Actual cause | Fix in this guide |
| --- | --- | --- |
| `/dashboard/tasks` is a 404 | `app/(dashboard)/tasks/page.tsx` creates `/tasks`, because route groups in parentheses do **not** appear in URLs. | Put the page at `app/(dashboard)/dashboard/tasks/page.tsx`. |
| Dashboard has a sidebar and a blank white main area | `DashboardPage` executes `if (!user) return null`. The session is not stable because the environment variables use the wrong NextAuth names. | Rename the variables and redirect unauthenticated users. |
| Build reports that pages are not modules/default React components | `app/(dashboard)/page.tsx` and `resources/page.tsx` are empty; `timer/page.tsx` exports a named component only. | Remove unused routes or give every retained route a default page export. |
| Task page fails TypeScript | `<TaskBoard>` is given children even though its props do not allow children. | Render it as `<TaskBoard initialTasks={tasks} />`. |
| API routes fail TypeScript | This project uses Zod 4, where `ZodError.errors` became `ZodError.issues`. | Use `parsed.error.issues[0]?.message`. |
| The app has two timers and inconsistent paths | Both `/timer` and `/dashboard/timer` exist. | Keep only `/dashboard/timer`. |

## 1. Fix the environment first

In `.env`, **rename** the existing keys. Do not commit this file.

```dotenv
DATABASE_URL="your existing PostgreSQL connection string"
NEXTAUTH_SECRET="your existing secret"
NEXTAUTH_URL="http://localhost:3000"
```

`NEXT_AUTH_SECRET` and `NEXT_URL` are not the variable names used by NextAuth v4. After changing them, stop the dev server, delete only the `.next` directory, start it again, and log in again. The previous browser session will be invalid.

```powershell
Remove-Item -LiteralPath .next -Recurse -Force
npm run dev
```

## 2. Use one route structure

Route groups are organizational only. `(dashboard)` does not produce `/dashboard`; the literal `dashboard` directory does. Make the tree below the source of truth.

```text
app/
  (auth)/
    login/page.tsx
    register/page.tsx
  (dashboard)/
    dashboard/
      layout.tsx
      page.tsx
      tasks/page.tsx
      timer/page.tsx
  api/
    auth/[...nextauth]/route.ts
    register/route.ts
    study-sessions/route.ts
    tasks/route.ts
    tasks/[id]/route.ts
```

Apply these file operations:

1. Delete `app/(dashboard)/page.tsx`; it is an empty, invalid `/` route.
2. Delete `app/(dashboard)/resources/page.tsx`; it is an empty, invalid `/resources` route. If resources are wanted later, create it with a default component.
3. Delete `app/(dashboard)/tasks/page.tsx`; it is the accidental `/tasks` route.
4. Delete `app/(dashboard)/timer/page.tsx`; it is the accidental `/timer` route and has no default export.
5. Delete `app/(dashboard)/dashboard/timer/timer-client.tsx`; this removes the duplicate timer implementation.
6. Create the `dashboard/tasks` and `dashboard/timer` page files in the next sections.

Keep `app/(dashboard)/layout.tsx` as follows (or delete it; it is optional). It must have a default layout export if retained.

```tsx
export default function DashboardRouteGroupLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
```

## 3. Never render an empty protected page

Replace `app/(dashboard)/dashboard/page.tsx` with this implementation. `redirect` makes the issue visible and recoverable; `return null` only creates a blank screen.

```tsx
import { redirect } from "next/navigation";
import { CheckCircle2, Clock3, ListTodo } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [pendingTasks, completedTasks, completedSessions, nextTask] =
    await Promise.all([
      prisma.task.count({ where: { userId: user.id, completed: false } }),
      prisma.task.count({ where: { userId: user.id, completed: true } }),
      prisma.studySession.count({ where: { userId: user.id } }),
      prisma.task.findFirst({
        where: { userId: user.id, completed: false },
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
        select: { title: true, dueDate: true, priority: true },
      }),
    ]);

  const cards = [
    { label: "Open tasks", value: pendingTasks, icon: ListTodo, tone: "bg-violet-100 text-violet-700" },
    { label: "Tasks completed", value: completedTasks, icon: CheckCircle2, tone: "bg-emerald-100 text-emerald-700" },
    { label: "Focus sessions", value: completedSessions, icon: Clock3, tone: "bg-amber-100 text-amber-700" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-600">Study dashboard</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          Good to see you, {user.name ?? "student"}.
        </h1>
        <p className="mt-2 text-slate-600">Make a small, useful step on your work today.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <Icon className={`mb-5 h-10 w-10 rounded-xl p-2 ${tone}`} aria-hidden="true" />
            <p className="text-sm font-medium text-slate-600">{label}</p>
            <p className="mt-1 text-4xl font-bold tracking-tight text-slate-950">{value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-violet-700">NEXT UP</p>
        {nextTask ? (
          <>
            <h2 className="mt-2 text-xl font-bold text-slate-950">{nextTask.title}</h2>
            <p className="mt-1 text-sm text-slate-600">
              {nextTask.dueDate ? `Due ${nextTask.dueDate.toLocaleDateString()}` : "No due date"} · {nextTask.priority.toLowerCase()} priority
            </p>
          </>
        ) : (
          <p className="mt-2 text-slate-600">No open tasks yet. Add one from the Tasks page.</p>
        )}
      </section>
    </div>
  );
}
```

## 4. Correct the dashboard shell and navigation

Replace `app/(dashboard)/dashboard/layout.tsx`. The `bg-slate-50`, constrained content width, and mobile header fix the current harsh empty canvas while keeping the sidebar.

```tsx
import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <Sidebar />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-10">{children}</main>
    </div>
  );
}
```

Replace `components/layout/sidebar.tsx`. The URLs now exactly match real pages, and `startsWith` keeps Tasks and Timer highlighted on any future nested pages.

```tsx
"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ListTodo, LogOut, Timer } from "lucide-react";

const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/tasks", label: "Tasks", icon: ListTodo },
  { href: "/dashboard/timer", label: "Focus timer", icon: Timer },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="border-b border-slate-800 bg-slate-950 text-slate-100 lg:flex lg:min-h-screen lg:w-64 lg:flex-col lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between px-5 py-4 lg:block lg:py-7">
        <Link href="/dashboard" className="text-xl font-bold tracking-tight">Athena<span className="text-violet-400">.</span></Link>
        <p className="hidden pt-1 text-sm text-slate-400 lg:block">Your focused study space</p>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:block lg:space-y-1 lg:px-3">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
          return <Link key={href} href={href} className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? "bg-violet-600 text-white shadow-sm" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}><Icon className="h-4 w-4" aria-hidden="true" />{label}</Link>;
        })}
      </nav>
      <button onClick={() => signOut({ callbackUrl: "/" })} className="m-3 flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white lg:mt-auto"><LogOut className="h-4 w-4" aria-hidden="true" />Log out</button>
    </aside>
  );
}
```

## 5. Implement the Tasks page at its real URL

Create `app/(dashboard)/dashboard/tasks/page.tsx`. Fetching initial data on the server avoids an empty loading-only page and removes the lint error caused by immediate state writes from an effect.

```tsx
import { redirect } from "next/navigation";
import { TaskBoard } from "@/components/tasks/task-board";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function TasksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const tasks = await prisma.task.findMany({ where: { userId: user.id }, orderBy: [{ completed: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }] });
  return <div className="mx-auto max-w-6xl"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-600">Plan your work</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Tasks</h1><p className="mt-2 text-slate-600">Keep the next important thing clear.</p><TaskBoard initialTasks={tasks.map((task) => ({ ...task, dueDate: task.dueDate?.toISOString() ?? null }))} /></div>;
}
```

Then change the `TaskBoard` declaration and remove only its `loading` state, `loadTasks` function, and `useEffect` import/call. Use this state declaration:

```tsx
import { useState } from "react";

type Task = { id: string; title: string; description: string | null; dueDate: string | null; priority: "LOW" | "MEDIUM" | "HIGH"; completed: boolean };
export function TaskBoard({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [error, setError] = useState("");
```

For successful create, toggle, and delete operations, update `tasks` from the API response instead of calling `loadTasks`. In `createTask`, replace `await loadTasks()` with:

```tsx
const created = await response.json();
setTasks((current) => [created, ...current]);
```

In `toggleTask`, check the response, read the updated task, and replace it:

```tsx
const response = await fetch(`/api/tasks/${task.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ completed: !task.completed }) });
if (!response.ok) return setError("Could not update the task.");
const updated = await response.json();
setTasks((current) => current.map((item) => item.id === updated.id ? updated : item));
```

In `deleteTask`, only remove locally after a successful response:

```tsx
const response = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
if (!response.ok) return setError("Could not delete the task.");
setTasks((current) => current.filter((item) => item.id !== task.id));
```

Remove `{loading && ...}` and change `!loading && tasks.length === 0` to `tasks.length === 0`.

## 6. Use one focus timer

Create `app/(dashboard)/dashboard/timer/page.tsx`:

```tsx
import { PomodoroTimer } from "@/components/timer/pomodoro-timer";
export default function TimerPage() {
  return <div className="mx-auto max-w-6xl"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-600">Deep work</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Focus timer</h1><PomodoroTimer /></div>;
}
```

Keep the existing `components/timer/pomodoro-timer.tsx`, but change its completion effect so it does not synchronously update state inside an effect. Replace the `useEffect` that begins `if (secondsLeft !== 0` with this:

```tsx
useEffect(() => {
  if (secondsLeft !== 0 || savedCompletion.current || !startedAt) return;
  savedCompletion.current = true;
  queueMicrotask(() => setRunning(false));
  void fetch("/api/study-sessions", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ durationMin: DURATION_MINUTES, startedAt }),
  }).then((response) => setMessage(response.ok ? "Session complete — saved to your history." : "Session completed, but could not be saved."));
}, [secondsLeft, startedAt]);
```

## 7. Repair all Zod 4 validation errors

In each of these files, replace `parsed.error.errors[0].message` with `parsed.error.issues[0]?.message ?? "Invalid request."`:

- `app/api/register/route.ts`
- `app/api/tasks/route.ts`
- `app/api/tasks/[id]/route.ts`

For example, the invalid body branch in a route should be:

```tsx
if (!parsed.success) {
  return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
}
```

Also remove the duplicate `app/api/auth/register/route.ts`. The form calls `/api/register`, so only `app/api/register/route.ts` is used. One registration endpoint prevents fixes drifting apart.

## 8. Clean up the root styling and current lint errors

In `app/layout.tsx`, actually use the imported fonts and use an explicit prop type:

```tsx
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body></html>;
}
```

Replace the `Don't have an account?` text in `app/(auth)/login/page.tsx` with `Don&apos;t have an account?` to satisfy the JSX lint rule.

In `app/globals.css`, use the generated font and remove the stray semicolon after the `button` rule:

```css
@import "tailwindcss";

:root { --background: #f8fafc; --foreground: #0f172a; }
* { box-sizing: border-box; }
body { margin: 0; min-width: 320px; background: var(--background); color: var(--foreground); font-family: var(--font-geist-sans), Arial, sans-serif; }
button, input, select, textarea { font: inherit; }
button { cursor: pointer; }
button:disabled { cursor: not-allowed; }
```

## 9. Verification order

Run these only after the route cleanup and code replacements above:

```powershell
npx prisma generate
npm run lint
npm run build
npm run dev
```

Manual acceptance checks:

1. Register a new user, then log in.
2. Visit `/dashboard`: it must show the greeting and three metric cards, never an empty main panel.
3. Click **Tasks**: the URL must be `/dashboard/tasks`, with no 404.
4. Create, complete, refresh, and delete a task.
5. Click **Focus timer**: the URL must be `/dashboard/timer`, and complete a short test session after temporarily setting the duration to one minute.
6. Log out and request `/dashboard` directly: it must redirect to `/login`.

If a dashboard route now redirects immediately after a successful login, check that `NEXTAUTH_SECRET` is spelled exactly as above, restart the server after changing `.env`, and clear the browser cookies for `localhost:3000` before logging in again.
