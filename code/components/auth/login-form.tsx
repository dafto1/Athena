"use client"; 
import { signIn } from "next-auth/react"; 
import { useRouter } from "next/navigation"; 
import { useState } from "react"; 

export function LoginForm() { 
  const router = useRouter(); 
  const [message, setMessage] = useState(""); 
  const [loading, setLoading] = useState(false);  
  async function onSubmit(event: React.FormEvent<HTMLFormElement>) { 
    event.preventDefault(); 
    setLoading(true); 
    setMessage(""); 
    const form = new FormData(event.currentTarget); 
    const result = await signIn("credentials", {
      redirect: false,
      email: form.get("email"),
      password: form.get("password"),
    }); 
    setLoading(false); 
    if (result?.error) return setMessage("Incorrect email or password. "); 
    router.push("/dashboard"); 
    router.refresh(); 
  }
  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
         <input required name="email" type="email" placeholder="Email" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
         <input required name="password" type="password" placeholder="Password" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
         {message && <p role="alert" className="text-sm text-rose-600">{message}</p>}
         <button disabled={loading} className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white disabled:opacity-60">
           {loading ? "Logging in..." : "Log in"}
         </button>
    </form>
  )
}