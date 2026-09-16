import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-sm border border-slate-200">
        <div>
          <h2 className="text-center text-3xl font-bold text-slate-900">Sign in to your account</h2>
          <p className="mt-2 text-center text-slate-600">
            Don't have an account?{" "}
            <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
              Create one
            </Link>
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}