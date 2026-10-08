import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { exchangeCalendarCode, normalizeProvider } from "@/lib/calendar";

export async function GET(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const url = new URL(request.url);
  const { provider: rawProvider } = await params;
  const provider = normalizeProvider(rawProvider);
  const user = await getCurrentUser();
  const redirect = (result: string) => NextResponse.redirect(new URL(`/dashboard/calendar?calendar=${result}`, request.url));
  if (!provider) return redirect("failed");

  const cookieName = `athena-calendar-state-${provider.toLowerCase()}`;
  const clearStateCookie = (response: NextResponse) => response.cookies.set(cookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/calendar",
    maxAge: 0,
  });
  const stateCookie = request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
  const state = url.searchParams.get("state");
  let validState = false;
  if (state && stateCookie && state === stateCookie && user) {
    const [payload, signature] = state.split(".");
    const secret = process.env.NEXTAUTH_SECRET ?? process.env.NEXT_AUTH_SECRET;
    try {
      const signedValue = Buffer.from(payload, "base64url").toString("utf8");
      const expected = secret ? createHmac("sha256", secret).update(signedValue).digest() : Buffer.alloc(0);
      const supplied = Buffer.from(signature, "base64url");
      validState = expected.length === supplied.length && timingSafeEqual(expected, supplied) && signedValue.startsWith(`${provider}:${user.id}:`);
    } catch {
      validState = false;
    }
  }
  if (!validState) {
    const failed = redirect("failed");
    clearStateCookie(failed);
    return failed;
  }
  if (!user) return redirect("failed");
  if (url.searchParams.has("error")) {
    const denied = redirect("denied");
    clearStateCookie(denied);
    return denied;
  }

  const code = url.searchParams.get("code");
  if (!code) {
    const failed = redirect("failed");
    clearStateCookie(failed);
    return failed;
  }

  try {
    await exchangeCalendarCode(provider, code, user.id);
    const connected = redirect("connected");
    clearStateCookie(connected);
    return connected;
  } catch (error) {
    console.error(`Calendar authorization failed for ${provider}:`, error);
    const failed = redirect("failed");
    clearStateCookie(failed);
    return failed;
  }
}
