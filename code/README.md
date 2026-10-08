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

Enable the Google Calendar API and request the read-only event and calendar-list scopes. For Microsoft, register a web redirect URI and grant delegated `Calendars.Read`, `User.Read`, `openid`, `profile`, `email`, and `offline_access` permissions. Generate the encryption key with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`; store it in the deployment secret manager and keep it stable so saved connections remain readable. OAuth tokens are encrypted before database storage.

Apply the calendar connection migration with `npx prisma migrate deploy` and regenerate the Prisma client with `npx prisma generate` after updating the schema.

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
