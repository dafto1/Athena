"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, ErrorBanner, Field, Input } from "@/components/ui";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) return setError(data.message ?? "Could not create the account.");
    router.push("/login?registered=1");
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <Field label="Full name" required>
        <Input required name="name" placeholder="Your name" />
      </Field>
      <Field label="Email" required>
        <Input required name="email" type="email" placeholder="you@university.edu" />
      </Field>
      <Field label="Password" required>
        <Input
          required
          name="password"
          type="password"
          minLength={8}
          placeholder="8+ characters"
        />
      </Field>
      {error && <ErrorBanner message={error} onDismiss={() => setError("")} />}
      <Button type="submit" variant="primary" className="w-full" disabled={loading}>
        {loading ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
