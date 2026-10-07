// Duration picker: lets the student choose how long to study.
// REQ-TIMER-008: Invalid durations are rejected (hook enforces range).

"use client";

import { useState } from "react";
import { Field, Input, Button } from "@/components/ui";
import { MIN_DURATION_MIN, MAX_DURATION_MIN } from "./types";

const PRESETS = [15, 25, 45, 60];

export function TimerDurationPicker({
  current,
  disabled,
  onChange,
}: {
  current: number;
  disabled: boolean;
  onChange: (min: number) => void;
}) {
  const [raw, setRaw] = useState(String(current));
  const [error, setError] = useState("");

  function handleCustomSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseInt(raw, 10);
    if (!Number.isInteger(parsed) || parsed < MIN_DURATION_MIN || parsed > MAX_DURATION_MIN) {
      setError(`Duration must be between ${MIN_DURATION_MIN} and ${MAX_DURATION_MIN} minutes.`);
      return;
    }
    setError("");
    onChange(parsed);
  }

  function handlePreset(min: number) {
    setRaw(String(min));
    setError("");
    onChange(min);
  }

  return (
    <div className="mt-6 space-y-3">
      {/* Quick presets */}
      <div className="flex flex-wrap justify-center gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            disabled={disabled}
            onClick={() => handlePreset(p)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition
              ${current === p
                ? "border-violet-600 bg-violet-600 text-white"
                : "border-slate-300 text-slate-600 hover:border-violet-400 hover:text-violet-700"
              } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {p} min
          </button>
        ))}
      </div>

      {/* Custom input */}
      <form onSubmit={handleCustomSubmit} className="flex items-end gap-2">
        <Field label="Custom (min)">
          <Input
            type="number"
            value={raw}
            min={MIN_DURATION_MIN}
            max={MAX_DURATION_MIN}
            disabled={disabled}
            onChange={(e) => setRaw(e.target.value)}
            className="w-24 text-center"
          />
        </Field>
        <Button type="submit" variant="secondary" size="sm" disabled={disabled}>
          Set
        </Button>
      </form>

      {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
    </div>
  );
}
