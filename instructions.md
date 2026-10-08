# Athena — Developer & Agent Instructions

This document provides architectural guidelines, coding standards, design conventions, and best practices for developers and AI agents working on the Athena codebase.

---

## 1. Project Overview & Tech Stack

Athena is an all-in-one Study Management Tool for students, providing:
- **Authentication & Account Management** (NextAuth, bcryptjs)
- **To-Do Tracker** (Priority management, due dates, filtering, task board)
- **Study Timer** (Customizable Pomodoro timer, persistent session logs)
- **Resource Management** (Academic file upload, categorization, filtering, search)
- **PDF Viewer & Annotation** (In-browser rendering via `react-pdf` / `pdfjs`, page navigation, zooming, text search, highlights, and sticky notes)
- **Calendar Synchronization** (Planned: Google Calendar / Outlook integration)
- **Study Group Collaboration** (Planned: Shared folders, notes, discussions)

### Core Technologies
- **Framework:** Next.js 16+ (App Router, Turbopack)
- **Frontend:** React 19, Tailwind CSS v4, Lucide React icons
- **Backend / API:** Next.js Route Handlers (`app/api/...`)
- **Database & ORM:** PostgreSQL (Neon Serverless) with Prisma ORM 7.x (`@prisma/adapter-pg`)
- **Validation:** Zod schemas in `lib/validations/`
- **Auth:** NextAuth (JWT session strategy)

---

## 2. Architecture & Directory Structure

Keep the codebase modular. Maintain small, focused files and avoid monolithic components.

```
athena/
├── docs/                                # SRS, architecture diagrams, project specifications
├── code/
│   ├── app/
│   │   ├── (auth)/                      # Auth route group (login, register)
│   │   ├── (dashboard)/                 # Authenticated layout & dashboard pages
│   │   │   └── dashboard/
│   │   │       ├── page.tsx             # Overview metrics & Next Up task
│   │   │       ├── tasks/               # To-do tracker page
│   │   │       ├── timer/               # Study timer page
│   │   │       └── resources/           # Resource manager & [id] PDF viewer
│   │   ├── api/                         # REST API Route Handlers
│   │   │   ├── auth/                    # NextAuth & registration endpoints
│   │   │   ├── tasks/                   # Tasks CRUD endpoints
│   │   │   ├── study-sessions/          # Timer session tracking endpoints
│   │   │   ├── resources/               # Resource upload, rename, delete
│   │   │   └── annotations/             # PDF annotation persistence
│   │   ├── generated/prisma/            # Generated Prisma client output
│   │   └── globals.css                  # Global styles & Tailwind imports
│   ├── components/
│   │   ├── ui.tsx                       # Reusable design primitives (Buttons, Modal, Inputs, etc.)
│   │   ├── layout/                      # Persistent Sidebar & navigation
│   │   ├── auth/                        # LoginForm, RegisterForm
│   │   ├── tasks/                       # TaskBoard, TaskCard, TaskForm, TaskFilters, types.ts
│   │   ├── timer/                       # PomodoroTimer, TimerDisplay, TimerControls, use-timer.ts, types.ts
│   │   ├── resources/                   # ResourceManager, ResourceCard, ResourceUploadForm, types.ts
│   │   └── pdf-viewer/                  # PdfWorkspace, PdfDocument, PdfToolbar, use-annotations.ts, types.ts
│   ├── lib/
│   │   ├── auth.ts                      # getCurrentUser() helper & NextAuth config
│   │   ├── prisma.ts                    # Resilient PostgreSQL pool & Prisma Client singleton
│   │   ├── files.ts                     # File format & MIME type helpers
│   │   ├── resources.ts                 # Resource access control queries
│   │   └── validations/                 # Zod validation schemas (task, resource, annotation, auth)
│   ├── prisma/
│   │   └── schema.prisma                # Data models and relations
│   └── scripts/                         # Build & maintenance scripts (e.g. PDF.js asset copy)
```

---

## 3. Strict Coding Standards & Modularity Rules

### 3.1 Modular File Structure & Component Sizing
- **Do not create monolithic files:** Aim for < 100–120 lines per file whenever possible.
- **Decompose into feature directories:** Group components, custom hooks, and types by feature (`components/<feature>/`).
- **Separate logic from presentation:**
  - Put complex state machines and side effects into custom hooks (e.g., `useTimer`, `usePdfViewer`, `useAnnotations`, `usePdfSearch`).
  - Keep presentation components clean, declarative, and focused on receiving props.

### 3.2 Reusability of UI Primitives
- Always reuse shared design primitives from [`components/ui.tsx`](file:///d:/college/tycse-degree/projects/athena/code/components/ui.tsx) (`Button`, `ButtonLink`, `IconButton`, `IconLink`, `Field`, `Input`, `Select`, `Textarea`, `Card`, `Modal`, `Badge`, `ErrorBanner`, `EmptyState`, `PageHeader`).
- If a new global primitive is needed, add it to `components/ui.tsx` rather than styling raw HTML elements in feature pages.

### 3.3 TypeScript & Type Safety
- Maintain 100% strict TypeScript compliance. Ensure `npx tsc --noEmit` passes with 0 errors on every change.
- Centralize feature types in `components/<feature>/types.ts` or `lib/validations/`.
- Avoid using `any` wherever possible. Define precise interfaces for API request/response bodies and UI props.

### 3.4 Data Validation & Security
- **Defense in Depth:** Validate inputs across multiple tiers:
  1. **UI Layer:** HTML constraints, form validation, immediate user feedback.
  2. **Client Hook / State:** Boundary checks and sanity rules.
  3. **Server Route Handlers:** Strict Zod parsing on all `POST`, `PATCH`, and `PUT` request bodies.
- **Strict User Isolation:** Always verify student authentication via `getCurrentUser()`. Enforce ownership checks on all mutating operations (`userId === user.id`) to prevent unauthorized access or IDOR vulnerabilities.
- **Informative Error Feedback:** Return descriptive, student-friendly error messages matching SRS requirements (e.g., invalid durations, unsupported file formats, size limits).

### 3.5 Database & Serverless PostgreSQL Best Practices
- The database is hosted on **Neon PostgreSQL (Serverless)**.
- Any new model or schema change in `prisma/schema.prisma` requires:
  1. `npx prisma generate` to update `@/app/generated/prisma`.
  2. Running a migration or verification script against the database.
- Keep the `pg.Pool` connection pool configuration resilient (configured in `lib/prisma.ts`) with idle timeout handling to prevent socket termination crashes on concurrent queries.

---

## 4. Git & Workflow Guidelines

- **Branching:** Work on dedicated feature branches (e.g., `feat/<feature-name>`, `fix/<issue-name>`).
- **Commits:** Write descriptive Conventional Commits (e.g., `feat(timer): ...`, `fix(resources): ...`, `refactor(tasks): ...`).
- **Build Verification:** Run `npx tsc --noEmit` and `npm run build` before finalizing any feature.
