import { createHmac, randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { calendarAuthorizationUrl, normalizeProvider } from "@/lib/calendar";

export async function GET(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sign in before connecting a calendar." }, { status: 401 });

  const { provider: rawProvider } = await params;
  const provider = normalizeProvider(rawProvider);
  if (!provider) return NextResponse.json({ message: "Unsupported calendar provider." }, { status: 404 });

  try {
    const userId = user.id;
    const nonce = randomBytes(32).toString("base64url");
    const signedValue = `${provider}:${userId}:${nonce}`;
    const secret = process.env.NEXTAUTH_SECRET ?? process.env.NEXT_AUTH_SECRET;
    if (!secret) throw new Error("NextAuth secret is not configured.");
    const state = `${Buffer.from(signedValue).toString("base64url")}.${createHmac("sha256", secret).update(signedValue).digest("base64url")}`;
    const response = NextResponse.redirect(calendarAuthorizationUrl(provider, state));
    response.cookies.set(`athena-calendar-state-${provider.toLowerCase()}`, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/calendar",
      maxAge: 600,
    });
    return response;
  } catch (error) {
    console.error("Calendar authorization could not start:", error);
    return NextResponse.redirect(new URL("/dashboard/calendar?calendar=not-configured", request.url));
  }
}
