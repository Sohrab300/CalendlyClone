import React from "react";
import { MarketingHeader } from "../components/MarketingHeader";
import { Footer } from "../components/Footer";

export default function TermsOfService() {
  return (
    <main className="min-h-screen bg-[#f7f9ff] text-slate-950">
      <MarketingHeader />
      
      <div className="mx-auto max-w-3xl px-5 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
            Terms of Service
          </h1>
          <p className="mt-4 text-slate-600 font-medium">Last updated: May 2026</p>
          <p className="mt-2 text-slate-500 text-sm italic">
            Please read these terms carefully before using this app.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 md:p-12 shadow-sm space-y-10">
          <section>
            <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900 border-l-4 border-teal-600 pl-4">
              About This App
            </h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              This is a free, educational scheduling app inspired by Calendly, built by an individual
              developer for learning purposes. It is not a commercial product.
            </p>
          </section>

          <section>
            <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900 border-l-4 border-teal-600 pl-4">
              Acceptance of Terms
            </h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              By signing up and using this app, you agree to these terms.
            </p>
          </section>

          <section>
            <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900 border-l-4 border-teal-600 pl-4">
              Use of the Service
            </h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              You may use this app to create scheduling links, manage your availability, and accept
              bookings. You must not use it for spam, illegal activity, or abuse.
            </p>
          </section>

          <section>
            <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900 border-l-4 border-teal-600 pl-4">
              Google Account Permissions
            </h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              By connecting your Google account, you authorise this app to send emails and create
              calendar events on your behalf. You can revoke this access at any time via your Google
              Account settings.
            </p>
          </section>

          <section>
            <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900 border-l-4 border-teal-600 pl-4">
              No Warranty
            </h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              This app is provided as-is for educational purposes. We make no guarantees about
              uptime, data integrity, or fitness for any particular purpose.
            </p>
          </section>

          <section>
            <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900 border-l-4 border-teal-600 pl-4">
              Limitation of Liability
            </h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              As an educational project, the developer is not liable for any loss or damage arising
              from use of this app.
            </p>
          </section>

          <section>
            <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900 border-l-4 border-teal-600 pl-4">
              Changes to Terms
            </h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              These terms may be updated occasionally. Continued use of the app means you accept
              the updated terms.
            </p>
          </section>

          <section>
            <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900 border-l-4 border-teal-600 pl-4">
              Contact
            </h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              If you have any questions, please contact{" "}
              <a href="mailto:terms@yourcalendlyclone.com" className="text-blue-600 hover:underline">
                terms@yourcalendlyclone.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}
