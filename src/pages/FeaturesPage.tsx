import React from "react";
import {
  AlertTriangle,
  CalendarCheck,
  CalendarDays,
  Code2,
  Grid2X2,
  Link2,
  MailCheck,
  Rocket,
  Settings2,
  Video,
} from "lucide-react";
import { MarketingHeader } from "../components/MarketingHeader";

const featureCards = [
  {
    title: "Custom Scheduling Links",
    description: "Share personalized booking links with custom event types.",
    icon: Link2,
    tone: "bg-blue-50 text-blue-700",
  },
  {
    title: "Smart Availability Engine",
    description:
      "Weekly availability, date overrides, and real-time booking conflict detection.",
    icon: CalendarCheck,
    tone: "bg-teal-50 text-teal-700",
  },
  {
    title: "Timezone-Aware Booking",
    description: "Automatic timezone conversion for hosts and invitees.",
    icon: Settings2,
    tone: "bg-orange-50 text-orange-700",
  },
  {
    title: "Email Verification & Confirmations",
    description: "Verify email and receive full confirmation via Gmail SMTP.",
    icon: MailCheck,
    tone: "bg-blue-50 text-blue-700",
  },
  {
    title: "Google Calendar & Meet",
    description: "Auto-create events with Google Meet links.",
    icon: Video,
    tone: "bg-teal-50 text-teal-700",
  },
  {
    title: "iCal Invite Generation",
    description: "Invites sent to both host and invitee.",
    icon: CalendarDays,
    tone: "bg-orange-50 text-orange-700",
  },
  {
    title: "Full Admin Dashboard",
    description: "Manage event types, availability, branding, contacts, and meetings.",
    icon: Grid2X2,
    tone: "bg-blue-50 text-blue-700",
  },
  {
    title: "High-Fidelity UI",
    description: "Pixel-accurate recreation of Calendly's UI using React 19 and Tailwind CSS.",
    icon: Code2,
    tone: "bg-teal-50 text-teal-700",
  },
  {
    title: "Deployed & Production-Ready",
    description: "Live on Vercel with Vite and TypeScript safety.",
    icon: Rocket,
    tone: "bg-orange-50 text-orange-700",
  },
];

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-[#f7f9ff] text-slate-950">
      <MarketingHeader />

      <section className="px-4 py-20 md:px-5">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-1 text-[11px] font-extrabold uppercase tracking-wide text-teal-700">
              <Code2 className="h-3.5 w-3.5" />
              // Architecture
            </div>
            <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-normal text-slate-950 md:text-5xl">
              Everything You&apos;d Expect.
              <span className="block text-blue-700">Built by One Developer.</span>
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
              A real-world scheduling product with a complete booking flow,
              admin dashboard, calendar integration, and more.
            </p>
          </div>

          <div className="mt-20 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {featureCards.map((feature) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.title}
                  className="min-h-44 rounded-lg border border-slate-300/80 bg-white p-7 shadow-sm shadow-slate-200/60"
                >
                  <div
                    className={`mb-6 flex h-10 w-10 items-center justify-center rounded-md ${feature.tone}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-2xl font-extrabold leading-tight tracking-normal text-slate-950">
                    {feature.title}
                  </h2>
                  <p className="mt-4 text-base leading-6 text-slate-600">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>

          <div className="mt-12 rounded-lg border border-blue-200 bg-blue-50 px-6 py-10 text-center text-slate-950">
            <AlertTriangle className="mx-auto h-9 w-9 text-blue-700" />
            <p className="mx-auto mt-5 max-w-3xl text-2xl font-extrabold leading-snug tracking-normal md:text-3xl">
              &quot;This is not an API wrapper. Every feature was hand-built as
              a learning exercise.&quot;
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

