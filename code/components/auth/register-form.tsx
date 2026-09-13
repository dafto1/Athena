"use client" 

import { useRouter } from "next/navigation"; 
import { useState } from "react"; 

export function RegisterForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.get("name"), email: form.get("email"), password: form.get("password") })
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) return setMessage(data.message ?? "Could not create the account.");
    router.push("/login?registered=1");
  }
  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <input required name="name" placeholder="Your name" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
      <input required name="email" type="email" placeholder="Email" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
      <input required name="password" type="password" minLength={8} placeholder="Password (8+ characters)" className="w-full rounded-lg border border-slate-300 px-3 py-2" /> 
      {message && <p role="alert" className="text-sm text-rose-600"> {message}</p>}
      <button disabled={loading} className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white disabled:opacity-60">
        {loading?"Creating account..." :"Create account."}
      </button>

    </form>
  )
}  
