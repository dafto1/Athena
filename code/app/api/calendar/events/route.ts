import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { CalendarSyncBusyError, synchronizeCalendarEvents } from "@/lib/calendar";

/** Returns synchronized events for the authenticated user's requested date range. */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sign in to view calendar events." }, { status: 401 });

  const params = new URL(request.url).searchParams;
  const start = params.get("start");
  const end = params.get("end");
  const startTime = start ? Date.parse(start) : Number.NaN;
  const endTime = end ? Date.parse(end) : Number.NaN;
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || startTime >= endTime || endTime - startTime > 62 * 24 * 60 * 60 * 1000) {
    return NextResponse.json({ message: "Choose a valid calendar date range of 62 days or less." }, { status: 400 });
  }

  try {
    const result = await synchronizeCalendarEvents(user.id, new Date(startTime).toISOString(), new Date(endTime).toISOString());
    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Calendar synchronization could not complete:", error);
    if (error instanceof CalendarSyncBusyError) {
      return NextResponse.json({ message: error.message }, { status: 429, headers: { "Retry-After": "2", "Cache-Control": "private, no-store" } });
    }
    return NextResponse.json({ events: [], errors: [{ provider: null, message: "Calendar synchronization could not be completed. Please retry." }] }, { headers: { "Cache-Control": "private, no-store" } });
  }
}
