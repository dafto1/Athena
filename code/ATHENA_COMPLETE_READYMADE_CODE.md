# Athena — complete ready-made core code

This is a file-by-file, copy-paste implementation of **Athena Core**: registration, login/logout, a protected dashboard, complete personal task CRUD, and a Pomodoro timer that saves completed study sessions.

It is intentionally honest about scope. Google/Outlook synchronization, real cloud file storage/PDF annotation, and real-time study-group updates need external accounts, OAuth credentials, a storage provider, and a WebSocket provider. They cannot be genuinely runnable from only code in this repository. The SRS calls for them, but this guide does not pretend that placeholder buttons are complete integrations.

## What this code does

| Module | Result |
| --- | --- |
| Authentication | Students can register with email/password, log in, log out, and cannot enter `/dashboard` while logged out. |
| Task tracker | A signed-in student can add, see, complete, and delete only their own tasks. Data is validated and stored in PostgreSQL. |
| Timer | A 25-minute countdown starts, pauses, resets, and writes a completed session to PostgreSQL. |
| Dashboard | Shows the student’s own pending-task and focus-session counts. |
| Database | Prisma models protect data ownership through a `userId` relation. |

## 0. Before you paste code

Open a PowerShell terminal in `code/` and install the one missing TypeScript type package:

```powershell
npm install -D @types/pg
```

You also need a PostgreSQL database. For local development, create a database named `athena`, then create `.env` from this template.

### `.env` — create this file yourself; do not commit it

```env
DATABASE_URL="postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/athena?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-this-with-a-long-random-secret"
```

Generate a safe secret with:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

`DATABASE_URL` connects Prisma to PostgreSQL. `NEXTAUTH_SECRET` signs login cookies. Never publish either value.

## 1. Create this folder structure

```text
code/
  app/
    (auth)/login/page.tsx
    (auth)/register/page.tsx
    (dashboard)/dashboard/page.tsx
    (dashboard)/dashboard/tasks/page.tsx
    (dashboard)/dashboard/timer/page.tsx
    api/auth/[...nextauth]/route.ts
    api/register/route.ts
    api/study-sessions/route.ts
    api/tasks/route.ts
    api/tasks/[taskId]/route.ts
    globals.css
    layout.tsx
    page.tsx
  components/
    auth/login-form.tsx
    auth/register-form.tsx
    layout/sidebar.tsx
    tasks/task-board.tsx
    timer/pomodoro-timer.tsx
  lib/
    auth.ts
    prisma.ts
    validations/auth.ts
    validations/task.ts
  prisma/schema.prisma
  types/next-auth.d.ts
  middleware.ts
  prisma.config.ts
```

The generated `app/generated/prisma/` folder and `next-env.d.ts` are created by Prisma/Next.js; do not hand-write them.

## 2. Database schema

Replace `prisma/schema.prisma` with this code.

```prisma
generator client {
  provider = "prisma-client"
  output   = "../app/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
}

model User {
  id            String         @id @default(cuid())
  name          String?
  email         String         @unique
  passwordHash  String
  createdAt     DateTime       @default(now())
  tasks         Task[]
  studySessions StudySession[]
}

model Task {
  id          String       @id @default(cuid())
  title       String
  description String?
  dueDate     DateTime?
  priority    TaskPriority @default(MEDIUM)
  completed   Boolean      @default(false)
  completedAt DateTime?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  userId      String
  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, completed, dueDate])
}

model StudySession {
  id          String   @id @default(cuid())
  durationMin Int
  startedAt   DateTime
  completedAt DateTime @default(now())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, completedAt])
}
```

`User` is the account table. `Task` and `StudySession` both have a `userId`, which means every saved record belongs to one user. The index makes the common “show my pending tasks” query faster.

Now create the database tables and generated Prisma client:

```powershell
npx prisma migrate dev --name initial_athena_core
npx prisma generate
```

## 3. Prisma configuration and reusable database client

### `prisma.config.ts`

```ts
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env.DATABASE_URL },
});
```

### `lib/prisma.ts`

```ts
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pool?: Pool;
};

const pool = globalForPrisma.pool ?? new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pool = pool;
}
```

Prisma is how TypeScript reads and writes PostgreSQL. The global cache prevents a new database pool being created every time Next.js refreshes a server module during development.

## 4. Validate incoming data

### `lib/validations/auth.ts`

```ts
import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().trim().email("Enter a valid email address").toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

export const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1),
});
```

### `lib/validations/task.ts`

```ts
import { z } from "zod";

const optionalDate = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.string().datetime().optional(),
);

export const taskSchema = z.object({
  title: z.string().trim().min(1, "A task title is required").max(120),
  description: z.string().trim().max(1000).optional(),
  dueDate: optionalDate,
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
});

export const taskUpdateSchema = taskSchema.partial().extend({
  completed: z.boolean().optional(),
});
```

Validation runs on the server. This is essential: a person can bypass browser form rules and call an API directly.

## 5. Authentication

### `types/next-auth.d.ts`

```ts
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
    };
  }
}
```

This tells TypeScript that our login session includes the database user ID.

### `lib/auth.ts`

```ts
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user) return null;

        const passwordMatches = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!passwordMatches) return null;

        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
};

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}
```

### `app/api/auth/[...nextauth]/route.ts`

```ts
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

### `app/api/register/route.ts`

```ts
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Please correct the form fields." }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (existingUser) {
    return NextResponse.json({ message: "An account already uses this email." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await prisma.user.create({
    data: { name: parsed.data.name, email: parsed.data.email, passwordHash },
  });

  return NextResponse.json({ message: "Account created." }, { status: 201 });
}
```

Passwords are hashed before storage. The original password is never inserted into PostgreSQL.

### `middleware.ts`

```ts
export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/dashboard/:path*"],
};
```

Middleware redirects logged-out visitors away from all dashboard URLs. APIs still do their own ownership checks, because middleware alone does not secure database queries.

## 6. Application layout and public pages

### `app/layout.tsx`

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Athena | Study Management",
  description: "Tasks and focused study sessions in one place.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

### `app/globals.css`

```css
@import "tailwindcss";

:root {
  --background: #f8fafc;
  --foreground: #0f172a;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
}

button, input, select, textarea { font: inherit; }
button { cursor: pointer; }
```

### `app/page.tsx`

```tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-bold tracking-widest text-indigo-600">ATHENA</p>
      <h1 className="mt-3 max-w-3xl text-5xl font-bold tracking-tight text-slate-950">
        Your study space, organised.
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
        Keep coursework and focused study sessions together in one private dashboard.
      </p>
      <div className="mt-8 flex gap-3">
        <Link className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white" href="/register">Create account</Link>
        <Link className="rounded-lg border border-slate-300 px-5 py-3 font-semibold" href="/login">Log in</Link>
      </div>
    </main>
  );
}
```

## 7. Registration and login screens

### `app/(auth)/register/page.tsx`

```tsx
import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <main className="mx-auto grid min-h-screen max-w-md place-items-center p-6">
      <section className="w-full rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-2xl font-bold">Create your Athena account</h1>
        <p className="mt-2 text-slate-600">Start with your tasks and focus sessions.</p>
        <RegisterForm />
        <p className="mt-5 text-sm text-slate-600">Already have an account? <Link className="font-semibold text-indigo-600" href="/login">Log in</Link></p>
      </section>
    </main>
  );
}
```

### `components/auth/register-form.tsx`

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RegisterForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.get("name"), email: form.get("email"), password: form.get("password") }),
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) return setMessage(data.message ?? "Could not create the account.");
    router.push("/login?registered=1");
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <input required name="name" placeholder="Your name" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
      <input required name="email" type="email" placeholder="Email" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
      <input required name="password" type="password" minLength={8} placeholder="Password (8+ characters)" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
      {message && <p role="alert" className="text-sm text-rose-600">{message}</p>}
      <button disabled={loading} className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white disabled:opacity-60">
        {loading ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
```

### `app/(auth)/login/page.tsx`

```tsx
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto grid min-h-screen max-w-md place-items-center p-6">
      <section className="w-full rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="mt-2 text-slate-600">Log in to open your study space.</p>
        <LoginForm />
        <p className="mt-5 text-sm text-slate-600">New to Athena? <Link className="font-semibold text-indigo-600" href="/register">Create an account</Link></p>
      </section>
    </main>
  );
}
```

### `components/auth/login-form.tsx`

```tsx
"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      redirect: false,
      email: form.get("email"),
      password: form.get("password"),
    });
    setLoading(false);
    if (result?.error) return setMessage("Incorrect email or password.");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <input required name="email" type="email" placeholder="Email" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
      <input required name="password" type="password" placeholder="Password" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
      {message && <p role="alert" className="text-sm text-rose-600">{message}</p>}
      <button disabled={loading} className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white disabled:opacity-60">
        {loading ? "Logging in..." : "Log in"}
      </button>
    </form>
  );
}
```

## 8. Protected dashboard and navigation

### `components/layout/sidebar.tsx`

```tsx
"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/tasks", label: "Tasks" },
  { href: "/dashboard/timer", label: "Focus timer" },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex min-h-screen w-56 flex-col bg-slate-950 p-5 text-slate-100">
      <Link href="/dashboard" className="text-xl font-bold">Athena</Link>
      <nav className="mt-8 space-y-1">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className={`block rounded-lg px-3 py-2 ${pathname === link.href ? "bg-indigo-600" : "hover:bg-slate-800"}`}>
            {link.label}
          </Link>
        ))}
      </nav>
      <button onClick={() => signOut({ callbackUrl: "/" })} className="mt-auto rounded-lg border border-slate-700 px-3 py-2 text-left hover:bg-slate-800">Log out</button>
    </aside>
  );
}
```

### `app/(dashboard)/dashboard/layout.tsx`

```tsx
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { getCurrentUser } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <div className="flex"><Sidebar /><main className="min-h-screen flex-1 p-8">{children}</main></div>;
}
```

### `app/(dashboard)/dashboard/page.tsx`

```tsx
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const [pendingTasks, sessions] = await Promise.all([
    prisma.task.count({ where: { userId: user.id, completed: false } }),
    prisma.studySession.count({ where: { userId: user.id } }),
  ]);
  return (
    <section>
      <p className="text-sm font-medium text-indigo-600">STUDY DASHBOARD</p>
      <h1 className="mt-1 text-3xl font-bold">Hello, {user.name ?? "student"}.</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <article className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><p className="text-slate-600">Pending tasks</p><p className="mt-2 text-4xl font-bold">{pendingTasks}</p></article>
        <article className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><p className="text-slate-600">Completed focus sessions</p><p className="mt-2 text-4xl font-bold">{sessions}</p></article>
      </div>
    </section>
  );
}
```

## 9. Task API — the secure server code

### `app/api/tasks/route.ts`

```ts
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { taskSchema } from "@/lib/validations/task";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });
  const tasks = await prisma.task.findMany({
    where: { userId: user.id },
    orderBy: [{ completed: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(tasks);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });
  const parsed = taskSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message }, { status: 400 });
  const task = await prisma.task.create({
    data: { ...parsed.data, dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null, userId: user.id },
  });
  return NextResponse.json(task, { status: 201 });
}
```

### `app/api/tasks/[taskId]/route.ts`

```ts
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { taskUpdateSchema } from "@/lib/validations/task";

type Context = { params: Promise<{ taskId: string }> };

async function findOwnedTask(taskId: string, userId: string) {
  return prisma.task.findFirst({ where: { id: taskId, userId } });
}

export async function PATCH(request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });
  const { taskId } = await params;
  const task = await findOwnedTask(taskId, user.id);
  if (!task) return NextResponse.json({ message: "Task not found" }, { status: 404 });
  const parsed = taskUpdateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message }, { status: 400 });
  const data = parsed.data;
  const updated = await prisma.task.update({
    where: { id: task.id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
      ...(data.completed !== undefined && { completed: data.completed, completedAt: data.completed ? new Date() : null }),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });
  const { taskId } = await params;
  const task = await findOwnedTask(taskId, user.id);
  if (!task) return NextResponse.json({ message: "Task not found" }, { status: 404 });
  await prisma.task.delete({ where: { id: task.id } });
  return new NextResponse(null, { status: 204 });
}
```

Notice that update and delete first find a task using **both** `id` and `userId`. This is the line that prevents one logged-in student from changing another student’s task.

## 10. Task screen and interactive task board

### `app/(dashboard)/dashboard/tasks/page.tsx`

```tsx
import { TaskBoard } from "@/components/tasks/task-board";

export default function TasksPage() {
  return <section><p className="text-sm font-medium text-indigo-600">TASK TRACKER</p><h1 className="mt-1 text-3xl font-bold">Your coursework</h1><TaskBoard /></section>;
}
```

### `components/tasks/task-board.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";

type Task = { id: string; title: string; description: string | null; dueDate: string | null; priority: "LOW" | "MEDIUM" | "HIGH"; completed: boolean };

const priorityClass = { LOW: "bg-slate-100 text-slate-700", MEDIUM: "bg-amber-100 text-amber-800", HIGH: "bg-rose-100 text-rose-800" };

export function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadTasks() {
    setLoading(true);
    const response = await fetch("/api/tasks");
    if (!response.ok) setError("Could not load tasks.");
    else setTasks(await response.json());
    setLoading(false);
  }

  useEffect(() => { void loadTasks(); }, []);

  async function createTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/tasks", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: form.get("title"), description: form.get("description") || undefined, dueDate: form.get("dueDate") ? new Date(`${form.get("dueDate")}T00:00:00.000Z`).toISOString() : undefined, priority: form.get("priority") }),
    });
    if (!response.ok) { const data = await response.json(); return setError(data.message ?? "Could not add the task."); }
    event.currentTarget.reset();
    await loadTasks();
  }

  async function toggleTask(task: Task) {
    await fetch(`/api/tasks/${task.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ completed: !task.completed }) });
    await loadTasks();
  }

  async function deleteTask(task: Task) {
    if (!window.confirm(`Delete “${task.title}”? This cannot be undone.`)) return;
    await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
    await loadTasks();
  }

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[340px_1fr]">
      <form onSubmit={createTask} className="h-fit space-y-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="font-bold">Add task</h2>
        <input required name="title" maxLength={120} placeholder="Task title" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        <textarea name="description" maxLength={1000} placeholder="Optional description" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        <input name="dueDate" type="date" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        <select name="priority" defaultValue="MEDIUM" className="w-full rounded-lg border border-slate-300 px-3 py-2"><option value="LOW">Low priority</option><option value="MEDIUM">Medium priority</option><option value="HIGH">High priority</option></select>
        {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
        <button className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white">Add task</button>
      </form>
      <div className="space-y-3">
        {loading && <p>Loading tasks…</p>}
        {!loading && tasks.length === 0 && <p className="rounded-xl bg-white p-5 text-slate-600 ring-1 ring-slate-200">No tasks yet. Add your first one.</p>}
        {tasks.map((task) => <article key={task.id} className={`flex items-start gap-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 ${task.completed ? "opacity-60" : ""}`}>
          <input aria-label={`Mark ${task.title} complete`} type="checkbox" checked={task.completed} onChange={() => void toggleTask(task)} className="mt-1 h-4 w-4" />
          <div className="min-w-0 flex-1"><h2 className={`font-semibold ${task.completed ? "line-through" : ""}`}>{task.title}</h2>{task.description && <p className="mt-1 text-sm text-slate-600">{task.description}</p>}<div className="mt-3 flex gap-2 text-xs"><span className={`rounded-full px-2 py-1 font-semibold ${priorityClass[task.priority]}`}>{task.priority}</span>{task.dueDate && <span className="rounded-full bg-slate-100 px-2 py-1">Due {new Date(task.dueDate).toLocaleDateString()}</span>}</div></div>
          <button onClick={() => void deleteTask(task)} className="text-sm font-semibold text-rose-600">Delete</button>
        </article>)}
      </div>
    </div>
  );
}
```

The task board fetches the signed-in user’s data, creates a task using a form, sends `PATCH` when a checkbox changes, and asks for confirmation before deleting.

## 11. Timer and persisted study sessions

### `app/api/study-sessions/route.ts`

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const studySessionSchema = z.object({
  durationMin: z.number().int().min(1).max(180),
  startedAt: z.string().datetime(),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });
  const parsed = studySessionSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ message: "Invalid study session." }, { status: 400 });
  const session = await prisma.studySession.create({
    data: { userId: user.id, durationMin: parsed.data.durationMin, startedAt: new Date(parsed.data.startedAt) },
  });
  return NextResponse.json(session, { status: 201 });
}
```

### `app/(dashboard)/dashboard/timer/page.tsx`

```tsx
import { PomodoroTimer } from "@/components/timer/pomodoro-timer";

export default function TimerPage() {
  return <section><p className="text-sm font-medium text-indigo-600">FOCUS TIMER</p><h1 className="mt-1 text-3xl font-bold">One session at a time</h1><PomodoroTimer /></section>;
}
```

### `components/timer/pomodoro-timer.tsx`

```tsx
"use client";

import { useEffect, useRef, useState } from "react";

const DURATION_MINUTES = 25;
const INITIAL_SECONDS = DURATION_MINUTES * 60;

export function PomodoroTimer() {
  const [secondsLeft, setSecondsLeft] = useState(INITIAL_SECONDS);
  const [running, setRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const savedCompletion = useRef(false);

  useEffect(() => {
    if (!running || secondsLeft === 0) return;
    const timerId = window.setInterval(() => setSecondsLeft((value) => value - 1), 1000);
    return () => window.clearInterval(timerId);
  }, [running, secondsLeft]);

  useEffect(() => {
    if (secondsLeft !== 0 || savedCompletion.current || !startedAt) return;
    savedCompletion.current = true;
    setRunning(false);
    void fetch("/api/study-sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ durationMin: DURATION_MINUTES, startedAt }) })
      .then((response) => setMessage(response.ok ? "Session complete — saved to your history." : "Session completed, but could not be saved."));
  }, [secondsLeft, startedAt]);

  function start() { if (!startedAt) setStartedAt(new Date().toISOString()); setRunning(true); }
  function reset() { setRunning(false); setSecondsLeft(INITIAL_SECONDS); setStartedAt(null); setMessage(""); savedCompletion.current = false; }
  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  return <div className="mt-8 max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200"><p className="text-slate-600">25 minute focus session</p><p aria-live="polite" className="mt-4 text-7xl font-bold tabular-nums">{minutes}:{seconds}</p><div className="mt-7 flex justify-center gap-3"><button onClick={start} disabled={running || secondsLeft === 0} className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white disabled:opacity-50">Start</button><button onClick={() => setRunning(false)} disabled={!running} className="rounded-lg border border-slate-300 px-4 py-2 font-semibold disabled:opacity-50">Pause</button><button onClick={reset} className="rounded-lg border border-slate-300 px-4 py-2 font-semibold">Reset</button></div>{message && <p className="mt-5 text-sm text-slate-600">{message}</p>}</div>;
}
```

The first `useEffect` controls the browser countdown. Its cleanup stops old intervals. The second effect fires exactly once at zero and saves the session.

## 12. Run and verify

```powershell
npm run lint
npm run dev
```

Open `http://localhost:3000`, create an account, log in, add a task, mark it complete, delete it, and finish a timer session. Inspect saved data with:

```powershell
npx prisma studio
```

## 13. What remains for full SRS compliance

The runnable code above is a secure, testable core. To implement the remaining SRS modules, add these separately:

| Feature | Required external decision/code |
| --- | --- |
| Resource upload | S3/Cloudinary/Supabase Storage account; server-side file validation; `Resource` database model; signed URLs. |
| PDF viewer and annotations | `pdfjs-dist` (or React PDF); an `Annotation` model with resource ID, page number, coordinates, and content. |
| Google Calendar | Google Cloud OAuth client ID/secret, consent-screen setup, encrypted token storage, Calendar API sync job. |
| Outlook Calendar | Microsoft Entra app registration, OAuth configuration, Microsoft Graph API sync job. |
| Study groups | `StudyGroup`, `GroupMember`, shared-resource models, role checks on every API query, and a real-time provider such as Pusher/Socket.IO. |

Do not add these as buttons only. Each requires credentials and provider setup that only the project owner can create. Once those choices are made, implement them following the same pattern used here: authenticated user → server validation → permission check → database/external service → clear UI feedback.
