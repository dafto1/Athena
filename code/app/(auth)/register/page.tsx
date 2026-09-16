import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-sm border border-slate-200">
        <div>
          <h2 className="text-center text-3xl font-bold text-slate-900">Create your account</h2>
          <p className="mt-2 text-center text-slate-600">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Sign in
            </Link>
          </p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
} 

