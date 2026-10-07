// Displays the list of past study sessions for the authenticated user.
// REQ-TIMER-006 / REQ-TIMER-007

"use client";

import { useEffect, useState } from "react";
import { Card, EmptyState } from "@/components/ui";
import { Clock } from "lucide-react";
import type { StudySession } from "./types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function SessionHistory({ refreshKey }: { refreshKey: number }) {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/study-sessions")
      .then((r) => r.json())
      .then((data: StudySession[]) => setSessions(data))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  return (
    <section className="mt-10">
      <h2 className="mb-4 text-base font-semibold text-slate-800">Session history</h2>

      {loading && (
        <p className="text-sm text-slate-500">Loading…</p>
      )}

      {!loading && sessions.length === 0 && (
        <EmptyState
          icon={Clock}
          title="No sessions yet"
          description="Complete your first focus session to see it here."
        />
      )}

      {!loading && sessions.length > 0 && (
        <ul className="space-y-2">
          {sessions.map((s) => (
            <li key={s.id}>
              <Card className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-violet-500" />
                  <span className="text-sm font-medium text-slate-800">
                    {s.durationMin} min session
                  </span>
                </div>
                <span className="text-xs text-slate-400">{formatDate(s.completedAt)}</span>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
