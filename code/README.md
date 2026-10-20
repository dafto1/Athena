This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Calendar synchronization setup

Calendar connections use provider OAuth credentials and an application-owned 32-byte encryption key. Configure these server-side environment variables before enabling the feature:

```text
GOOGLE_CALENDAR_CLIENT_ID=
GOOGLE_CALENDAR_CLIENT_SECRET=
MICROSOFT_CALENDAR_CLIENT_ID=
MICROSOFT_CALENDAR_CLIENT_SECRET=
CALENDAR_TOKEN_ENCRYPTION_KEY=
```

Set `NEXTAUTH_URL` to the public Athena origin. Register these exact callback URLs with the provider applications:

- `${NEXTAUTH_URL}/api/calendar/callback/google`
- `${NEXTAUTH_URL}/api/calendar/callback/outlook`

Enable the Google Calendar API and request the `https://www.googleapis.com/auth/calendar.events` and `https://www.googleapis.com/auth/calendar.calendarlist.readonly` scopes. For Microsoft, register a web redirect URI and grant delegated `Calendars.ReadWrite`, `User.Read`, `openid`, `profile`, `email`, and `offline_access` permissions. Users with existing connections must reconnect to grant the expanded scopes; changing the requested scopes does not expand permissions on already-issued tokens. Generate the encryption key with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`; store it in the deployment secret manager and keep it stable so saved connections remain readable. OAuth tokens are encrypted before database storage.

Apply the calendar connection migration with `npx prisma migrate deploy` and regenerate the Prisma client with `npx prisma generate` after updating the schema.

## Selenium browser test

Install dependencies with `npm install`, start Athena with `npm run dev`, then run the browser smoke test from a second terminal. Use a test account because the test signs in to Athena.

```powershell
$env:SELENIUM_EMAIL = "test-account@example.com"
$env:SELENIUM_PASSWORD = "your-test-password"
$env:SELENIUM_HEADLESS = "1" # Optional: run Chrome without a visible window
npm run test:e2e
```

The test defaults to `http://localhost:3000`; set `SELENIUM_BASE_URL` to test another running instance. It signs in once and checks dashboard pages, search, task filters, calendar navigation and settings, resource and group search, and the focus timer. Timers are reset before completion, so tests do not create focus-session records. Selenium Manager obtains the matching browser driver when needed.

## White-box unit tests

Run the validation unit tests with:

```powershell
npm run test:unit
```

These tests call the authentication, task, resource, study-group, and annotation schemas directly. They cover normalization, defaults, boundary values, valid input, and rejection paths without opening a browser or writing to the database.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
