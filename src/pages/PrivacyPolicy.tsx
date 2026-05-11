import React from "react";
import { MarketingHeader } from "../components/MarketingHeader";
import { Footer } from "../components/Footer";

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-[#f7f9ff] text-slate-950">
      <MarketingHeader />

      <div className="mx-auto max-w-3xl px-5 py-20">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-4 text-slate-600 font-medium">Last updated: May 2026</p>
        </div>

        <div className="mb-10 rounded-xl border border-blue-100 bg-blue-50/50 p-6 text-center">
          <p className="text-sm leading-relaxed text-blue-800">
            <span className="font-bold">Note:</span> This is an educational project inspired by
            Calendly. We take your privacy seriously even as a learning project.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 md:p-12 shadow-sm space-y-10">
          <section>
            <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900 border-l-4 border-teal-600 pl-4">
              Who We Are
            </h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              This app is a Calendly-inspired scheduling tool built as a personal educational
              project. It is not affiliated with Calendly.
            </p>
          </section>

          <section>
            <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900 border-l-4 border-teal-600 pl-4">
              What Data We Collect
            </h2>
            <ul className="mt-4 list-inside list-disc space-y-2 text-slate-600">
              <li>Name</li>
              <li>Email address</li>
              <li>Google account information (when signing in via Google)</li>
              <li>Calendar event data</li>
              <li>Booking details</li>
            </ul>
          </section>

          <section>
            <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900 border-l-4 border-teal-600 pl-4">
              How We Use Your Data
            </h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              To create your account, send booking confirmation emails on your behalf via Gmail, add
              events to your Google Calendar, and manage your scheduling links.
            </p>
          </section>

          <section>
            <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900 border-l-4 border-teal-600 pl-4">
              Google API Permissions
            </h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              We request access to your Google Calendar and Gmail (send only) solely to provide core
              scheduling features. We do not read your existing emails or calendar events beyond
              what is necessary.
            </p>
          </section>

          <section>
            <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900 border-l-4 border-teal-600 pl-4">
              Data Storage
            </h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              Your data is stored securely using Supabase. We do not sell, share, or rent your data
              to any third party.
            </p>
          </section>

          <section>
            <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900 border-l-4 border-teal-600 pl-4">
              Third-Party Services
            </h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              We use Google OAuth, Google Calendar API, Gmail API, Supabase, and Vercel. Each has
              their own privacy policies.
            </p>
          </section>

          <section>
            <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900 border-l-4 border-teal-600 pl-4">
              Your Rights
            </h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              You can request deletion of your account and data at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900 border-l-4 border-teal-600 pl-4">
              Contact
            </h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              <a href="mailto:privacy@yourcalendlyclone.com" className="text-blue-600 hover:underline">
                privacy@yourcalendlyclone.com
              </a>
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}
