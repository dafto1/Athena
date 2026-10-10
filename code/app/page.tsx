import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-bold tracking-widest text-stone-700">ATHENA</p>
      <h1 className="mt-3 max-w-3xl text-5xl font-bold tracking-tight text-slate-950">
        Your study space, organised.
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
        Keep coursework and focused study sessions together in one private dashboard.
      </p>
      <div className="mt-8 flex gap-3">
        <Link className="rounded-lg bg-[#37352f] px-5 py-3 font-semibold text-white" href="/register">Create account</Link>
        <Link className="rounded-lg border border-slate-300 px-5 py-3 font-semibold" href="/login">Log in</Link>
      </div>
    </main>
  );
}
