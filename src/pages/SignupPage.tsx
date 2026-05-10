import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Construction } from "lucide-react";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12">
      <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/60">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-700">
          <Construction className="h-7 w-7" />
        </div>
        <h1 className="mt-6 text-3xl font-extrabold tracking-normal text-slate-950">
          Sign up is in progress
        </h1>
        <p className="mt-4 leading-7 text-slate-600">
          Account creation is coming soon. The login and booking flows are
          available while this page is being built.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back home
          </Link>
          <Link
            to="/admin/login"
            className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            Log in
          </Link>
        </div>
      </section>
    </main>
  );
}
