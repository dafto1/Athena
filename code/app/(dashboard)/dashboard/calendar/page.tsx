import { CalendarView } from "@/components/calendar/calendar-view";
import { PageHeader } from "@/components/ui";

/** Renders the protected calendar page and OAuth completion feedback. */
export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ calendar?: string }> }) {
  const { calendar } = await searchParams;
  const notice = calendar === "connected" || calendar === "denied" || calendar === "not-configured" || calendar === "failed"
    ? calendar
    : "";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow=""
        title="Calendar"
      />
      <CalendarView initialNotice={notice} />
    </div>
  );
}
