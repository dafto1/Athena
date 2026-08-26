import Link from "next/link"; 

export default function Home() { 
  return ( 
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center p-8">
      <p className = "text-sm font-medium text-indigo-600">Athena</p>
      <h1 className= "mt-2 text-4xl font-bold">Your very own Study Space. </h1>
      <p className="mt-4 max-w-xl text-slate-600">
        Track coursewor, focus sessions , resources and group work in one place. 
      </p> 
      <Link className="mt-8 w-fit rounded-lg bg-indigo-600 px-4 py-2 text-white" href="/login" >
        Get Started. 
      </Link>
    </main> 
  )
}