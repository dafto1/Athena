# Athena code-along guide

This guide translates the project documents into an implementation plan you can follow while reading the code. It is based on the SRS in [`docs/athena-srs-final (2).pdf`](docs/athena-srs-final%20(2).pdf) and the current application in `code/`.

## 1. What Athena is meant to be

Athena is a student study-management web app. A student should be able to:

1. Create an account and sign in.
2. Create, prioritise, complete, edit, and delete academic tasks.
3. Run a Pomodoro-style study timer and keep completed-session history.
4. Upload and organise study resources, then read and annotate PDFs in the browser.
5. Connect Google Calendar or Outlook and see relevant events.
6. Create study groups and share resources with permitted members.

The SRS makes the first three foundation areas **high priority**: authentication, to-do tracking, and timer. Resources/PDFs are also high priority; calendar and collaboration are medium priority. That is the correct order to build them in a semester project.

## 2. What is already in this repository

`code/` is a newly created Next.js application, not an implementation of Athena yet.

| Location | What it does now | Why it matters |
| --- | --- | --- |
| `code/app/page.tsx` | Shows the default Next.js welcome screen | Replace this with Athena's dashboard. |
| `code/app/layout.tsx` | Defines the global HTML layout and metadata | Add Athena title, description, providers, and the app shell here. |
| `code/app/globals.css` | Imports Tailwind CSS and global styles | Keep global design tokens here. |
| `code/prisma/schema.prisma` | Declares PostgreSQL and Prisma Client output | Add the database models here. |
| `code/prisma.config.ts` | Reads `DATABASE_URL` from `.env` | Prisma uses this connection string for migrations and queries. |
| `code/package.json` | Lists Next.js, Prisma, NextAuth, Zod, React Hook Form, etc. | Most of the intended stack is installed already. |

Useful distinction: the SRS says **what** Athena must do. The Next.js/Prisma files decide **how** the web application will do it.

## 3. The architecture to keep in your head

```text
Browser (React pages and client components)
          |
          | form/API request
          v
Next.js server (route handlers / server actions)
          |
          | Prisma queries
          v
PostgreSQL  <---->  Prisma schema
          |
          +----> Cloud object storage for uploaded files
          +----> Google / Microsoft OAuth APIs for calendar sync
```

Every private query must begin from the authenticated user. For example, do **not** fetch a task by only `taskId`; fetch it by both `taskId` and `userId`. This one habit enforces the SRS privacy rules (REQ-SEC-005 and BR-006).

## 4. Suggested folder layout

Create feature folders rather than putting all code into `app/page.tsx`:

```text
code/
  app/
    (auth)/login/page.tsx
    (auth)/register/page.tsx
    (dashboard)/layout.tsx
    (dashboard)/page.tsx
    (dashboard)/tasks/page.tsx
    (dashboard)/timer/page.tsx
    (dashboard)/resources/page.tsx
    api/tasks/route.ts
    api/tasks/[taskId]/route.ts
  components/
    tasks/task-form.tsx
    tasks/task-list.tsx
    timer/pomodoro-timer.tsx
    layout/sidebar.tsx
  lib/
    prisma.ts
    auth.ts
    validations/task.ts
  prisma/schema.prisma
```

Route groups such as `(auth)` organise files but do not add `/auth` to the URL. Thus `app/(auth)/login/page.tsx` is served at `/login`.

## 5. First make the starter speak Athena

Start the app from the `code` directory:

```powershell
cd code
npm run dev
```

Open `http://localhost:3000`. Then change the metadata in `app/layout.tsx`:

```tsx
export const metadata: Metadata = {
  title: "Athena | Study Management",
  description: "One place for tasks, focus sessions, resources, and study groups.",
};
```

Replace the default `app/page.tsx` with a deliberately small landing page first:

```tsx
import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center p-8">
      <p className="text-sm font-medium text-indigo-600">ATHENA</p>
      <h1 className="mt-2 text-4xl font-bold">Study with one clear system.</h1>
      <p className="mt-4 max-w-xl text-slate-600">
        Track coursework, focus sessions, resources, and group work in one place.
      </p>
      <Link className="mt-8 w-fit rounded-lg bg-indigo-600 px-4 py-2 text-white" href="/login">
        Get started
      </Link>
    </main>
  );
}
```

This is only the public entry point. The real work begins after sign-in.

## 6. Database design: turn nouns into models

Read the SRS and underline nouns that need to survive a page refresh: student, task, study session, resource, folder, group, membership, annotation, calendar connection, and event. Those nouns become database models.

Use this as the first serious version of `prisma/schema.prisma`:

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

enum GroupRole {
  OWNER
  MEMBER
}

model User {
  id            String         @id @default(cuid())
  name          String?
  email         String         @unique
  passwordHash  String?
  createdAt     DateTime       @default(now())
  tasks         Task[]
  studySessions StudySession[]
  resources     Resource[]
  memberships   GroupMember[]
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
  completedAt DateTime?
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Resource {
  id        String   @id @default(cuid())
  name      String
  storageKey String  @unique
  mimeType  String
  sizeBytes Int
  createdAt DateTime @default(now())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model StudyGroup {
  id          String        @id @default(cuid())
  name        String
  description String?
  createdAt   DateTime      @default(now())
  members     GroupMember[]
}

model GroupMember {
  groupId String
  userId  String
  role    GroupRole @default(MEMBER)
  group   StudyGroup @relation(fields: [groupId], references: [id], onDelete: Cascade)
  user    User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([groupId, userId])
}
```

Why these details matter:

- `userId` establishes ownership for tasks, sessions, and resources.
- `onDelete: Cascade` deletes dependent records when a user is removed. Use it only where that behaviour is truly desired.
- `@@index(...)` makes the common “show my pending tasks by date” query efficient.
- The composite primary key `@@id([groupId, userId])` prevents duplicate memberships.

Set `DATABASE_URL` in `code/.env` (never commit it), then create the first migration:

```powershell
npx prisma migrate dev --name init
npx prisma generate
```

## 7. Share one Prisma client

Create `lib/prisma.ts`. Development mode reloads modules often; storing the client globally avoids creating too many database connections.

```ts
import { PrismaClient } from "@/app/generated/prisma/client";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

The exact import path must match Prisma's generated output. In this project the schema's `output = "../app/generated/prisma"` is the reason the import starts with `@/app/generated/prisma/...`.

## 8. Authentication before private features

The project has `next-auth` and `bcryptjs`. Implement registration, credential hashing, sign-in, and route protection before writing private task APIs.

At registration, never store the raw password:

```ts
import bcrypt from "bcryptjs";

const passwordHash = await bcrypt.hash(password, 12);

await prisma.user.create({
  data: { name, email, passwordHash },
});
```

At login, compare the supplied password with the stored hash:

```ts
const user = await prisma.user.findUnique({ where: { email } });

if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
  throw new Error("Invalid email or password");
}
```

Important: authentication is not just a login screen. Server-side code must obtain the current session and use `session.user.id` for every database operation. The browser cannot be trusted to send a valid `userId`.

## 9. Build the first complete vertical slice: tasks

This slice fulfils REQ-TODO-001 through REQ-TODO-009 and teaches the core pattern used by later modules:

```text
form -> client validation -> protected server route -> database -> updated UI
```

### 9.1 Validate input with Zod

Create `lib/validations/task.ts`:

```ts
import { z } from "zod";

export const taskSchema = z.object({
  title: z.string().trim().min(1, "A task title is required").max(120),
  description: z.string().trim().max(1000).optional(),
  dueDate: z.string().datetime().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
});

export type TaskInput = z.infer<typeof taskSchema>;
```

Zod checks untrusted input on the server. React Hook Form can reuse this schema in the browser for faster feedback, but browser validation alone is not security.

### 9.2 Create and list only the signed-in user's tasks

Create `app/api/tasks/route.ts`. `requireUser()` below represents a small helper you will make using your auth/session library; it must return the signed-in user or throw/return an unauthorised response.

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { taskSchema } from "@/lib/validations/task";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const user = await requireUser();

  const tasks = await prisma.task.findMany({
    where: { userId: user.id },
    orderBy: [{ completed: "asc" }, { dueDate: "asc" }],
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
      userId: user.id,
    },
  });

  return NextResponse.json(task, { status: 201 });
}
```

The ownership rule is in `where: { userId: user.id }` and `userId: user.id`, not in the UI. That is the implementation of “private tasks stay private.”

### 9.3 Toggle completion securely

For `app/api/tasks/[taskId]/route.ts`, include the owner in the lookup before updating:

```ts
const task = await prisma.task.findFirst({
  where: { id: params.taskId, userId: user.id },
});

if (!task) {
  return NextResponse.json({ message: "Task not found" }, { status: 404 });
}

const updatedTask = await prisma.task.update({
  where: { id: task.id },
  data: {
    completed: !task.completed,
    completedAt: task.completed ? null : new Date(),
  },
});
```

Use the same owner-check pattern for edit and delete. Before a destructive `DELETE`, show a confirmation dialog as required by REQ-SAFE-001.

### 9.4 A small task form

The form must be a client component because it needs user interaction:

```tsx
"use client";

import { useState } from "react";

export function TaskForm({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  async function createTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, priority: "MEDIUM" }),
    });

    if (!response.ok) {
      setError("Could not create the task. Check the title and try again.");
      return;
    }

    setTitle("");
    onCreated();
  }

  return (
    <form onSubmit={createTask} className="flex gap-2">
      <label className="sr-only" htmlFor="task-title">Task title</label>
      <input id="task-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Finish DBMS assignment" />
      <button type="submit">Add task</button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
```

This is intentionally small. Once it works, add description, date, and priority inputs, then replace manual state with React Hook Form + `zodResolver`.

## 10. Add the Pomodoro timer as a client component

The live countdown belongs in a client component. The completed record belongs on the server.

```tsx
"use client";

import { useEffect, useState } from "react";

const DEFAULT_SECONDS = 25 * 60;

export function PomodoroTimer() {
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_SECONDS);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning || secondsLeft === 0) return;

    const intervalId = window.setInterval(() => {
      setSecondsLeft((seconds) => seconds - 1);
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isRunning, secondsLeft]);

  useEffect(() => {
    if (secondsLeft !== 0) return;
    setIsRunning(false);
    // Next step: POST the completed session to /api/study-sessions.
  }, [secondsLeft]);

  const minutes = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const seconds = (secondsLeft % 60).toString().padStart(2, "0");

  return (
    <section>
      <p aria-live="polite" className="text-6xl tabular-nums">{minutes}:{seconds}</p>
      <button onClick={() => setIsRunning(true)} disabled={isRunning || secondsLeft === 0}>Start</button>
      <button onClick={() => setIsRunning(false)} disabled={!isRunning}>Pause</button>
      <button onClick={() => { setIsRunning(false); setSecondsLeft(DEFAULT_SECONDS); }}>Reset</button>
    </section>
  );
}
```

The cleanup function is essential: it removes the interval when the component rerenders or unmounts, preventing multiple timers from running. Validate configured minutes on the server before saving (`positive integer`, sensible maximum) for REQ-TIMER-008.

## 11. Add resources and PDFs only after the foundation works

The SRS requires cloud storage, not files stored directly inside the Next.js project. The correct flow is:

```text
select PDF -> validate name/type/size -> upload to object storage
           -> save Resource metadata in PostgreSQL -> display resource list
           -> open authorised PDF URL in PDF viewer -> save annotations separately
```

Validate MIME type, extension, size, and ownership on the server. Do not trust a browser-provided filename or MIME type alone. For a first demo, use PDF.js to render pages; save annotations in a separate `Annotation` model containing `resourceId`, `pageNumber`, annotation type, position data, and contents.

## 12. Calendar and groups: build behind stable boundaries

Calendar integrations use OAuth. Store provider/account identifiers and encrypted/securely managed tokens; never expose provider tokens to the client. Import events into a local `CalendarEvent` table, then let the dashboard read from that table even when a provider is temporarily unavailable.

For groups, permission checking should be one reusable function:

```ts
async function canAccessGroup(userId: string, groupId: string) {
  return prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
}
```

Call it before reading or modifying any group resource. Add a role check before actions reserved for owners. This directly implements REQ-GROUP-006, REQ-GROUP-010, and BR-004.

## 13. Build order and definition of done

| Increment | Deliverable | Requirements covered |
| --- | --- | --- |
| 1 | App shell, database, registration/login, protected dashboard | AUTH, SEC |
| 2 | Complete task CRUD with validation, ordering, and confirmations | TODO, SAFE |
| 3 | Accurate timer and persisted session history | TIMER |
| 4 | Upload/list/delete resources and in-browser PDF reading | RES, PDF |
| 5 | Google/Outlook connection, sync status, local event view | CAL |
| 6 | Groups, membership, sharing, permission checks, updates | GROUP |

For each increment, it is done only when:

- The happy path works in the browser.
- Invalid input gives a helpful message.
- Another user cannot access the first user's data.
- Refreshing the page preserves data that is meant to be persistent.
- The relevant SRS requirement IDs have a test or manual test checklist entry.

## 14. Practical reading sequence

When you open the project, follow this order:

1. Read `package.json` to learn the available tools.
2. Read `app/layout.tsx`, then `app/page.tsx`, to understand Next.js rendering from the outside in.
3. Read `prisma/schema.prisma` to understand the data that needs to persist.
4. Implement authentication and read the session helper until ownership checks make sense.
5. Build the task feature end-to-end before starting a second feature.
6. Build the timer, then resources/PDFs, then integrations and collaboration.

Avoid building all screens first with dummy data. A thin, real, end-to-end feature teaches more and prevents security/data-model mistakes from spreading across the project.

## 15. Commands you will use often

Run these inside `code/`:

```powershell
npm run dev                 # local development server
npm run lint                # lint TypeScript/React code
npx prisma migrate dev      # create/apply a development migration
npx prisma generate         # regenerate Prisma Client after schema changes
npx prisma studio           # inspect the database in a local UI
npm run build               # production build check
```

Do not commit `.env`, and do not paste credentials, OAuth secrets, or a production database URL into source files or documentation.

---

The best next coding milestone is **Increment 1 + the task vertical slice**. It validates the Next.js, Prisma, authentication, validation, database, and UI patterns that every remaining Athena module will reuse.
