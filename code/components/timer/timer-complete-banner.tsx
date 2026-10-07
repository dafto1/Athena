// Banner shown when a session reaches zero (REQ-TIMER-005) and after saving (REQ-TIMER-006).

type BannerKind = "saving" | "saved" | "error";

export function TimerCompleteBanner({ kind }: { kind: BannerKind }) {
  const styles: Record<BannerKind, string> = {
    saving: "border-slate-200 bg-slate-50 text-slate-600",
    saved:  "border-emerald-200 bg-emerald-50 text-emerald-800",
    error:  "border-rose-200 bg-rose-50 text-rose-700",
  };

  const messages: Record<BannerKind, string> = {
    saving: "⏳ Saving your session…",
    saved:  "🎉 Session complete — saved to your history!",
    error:  "Session completed, but could not be saved. Please try again.",
  };

  return (
    <p className={`mt-5 rounded-xl border px-4 py-2.5 text-sm font-medium ${styles[kind]}`}>
      {messages[kind]}
    </p>
  );
}
