import React from "react";
import { Link } from "react-router-dom";
import {
  CalendarClock,
  Code2,
  Database,
  Github,
  Layers,
  Mail,
  Server,
} from "lucide-react";
import { MarketingHeader } from "../components/MarketingHeader";
import { Footer } from "../components/Footer";

const githubUrl = "https://github.com/Sohrab300/CalendlyClone";

const stackGroups = [
  {
    title: "Frontend",
    icon: Layers,
    tone: "bg-blue-50 text-blue-700 border-blue-200",
    tags: ["React 19", "TypeScript", "Vite", "Tailwind CSS", "React Router", "Motion"],
  },
  {
    title: "Backend",
    icon: Server,
    tone: "bg-teal-50 text-teal-700 border-teal-200",
    tags: ["Node.js", "Express.js", "TypeScript", "REST API"],
  },
  {
    title: "Database & Auth",
    icon: Database,
    tone: "bg-orange-50 text-orange-700 border-orange-200",
    tags: ["Supabase", "Supabase Auth", "Supabase SDK"],
  },
  {
    title: "Scheduling & Time",
    icon: CalendarClock,
    tone: "bg-blue-50 text-blue-700 border-blue-200",
    tags: ["date-fns", "date-fns-tz", "Timezone Handling", "Conflict Logic"],
  },
  {
    title: "Email & Calendar",
    icon: Mail,
    tone: "bg-teal-50 text-teal-700 border-teal-200",
    tags: ["Nodemailer", "Google Calendar API", "Google Meet", "iCal Generation"],
  },
  {
    title: "Deployment & Tooling",
    icon: Code2,
    tone: "bg-slate-100 text-slate-700 border-slate-200",
    tags: ["Vercel", "npm", "tsx", "tsc"],
  },
];

export default function ProductPage() {
  return (
    <main className="min-h-screen bg-[#f7f9ff] text-slate-950">
      <MarketingHeader />

      <section className="border-b border-slate-200/70 bg-[radial-gradient(circle_at_top,#eaf2ff_0%,#f7f9ff_52%,#ffffff_100%)] px-4 py-20 md:px-5">
        <div className="mx-auto max-w-6xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-blue-700">
            <Code2 className="h-3.5 w-3.5" />
            V1.0 released
          </div>

          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold leading-tight tracking-normal text-slate-950 md:text-5xl">
            A Full-Stack Scheduling App, Built from Scratch.
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
            Every feature you see was designed, built, and deployed by one
            developer as a learning project inspired by Calendly.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/features"
              className="inline-flex h-12 items-center justify-center rounded-full bg-blue-600 px-8 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
            >
              Explore Features
            </Link>
            <a
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-8 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
            >
              <Github className="h-4 w-4" />
              View GitHub
            </a>
          </div>

          <div
            className="mt-16 h-80 overflow-hidden rounded-lg border border-slate-200 bg-cover bg-center shadow-sm md:h-[405px]"
            style={{
              backgroundImage:
                "linear-gradient(180deg,rgba(247,249,255,0.08),rgba(247,249,255,0.88)),url('https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1800&q=85')",
            }}
            aria-label="Developer workspace with code editor"
          />
        </div>
      </section>

      <section className="px-4 py-20 md:px-5">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-xs font-extrabold uppercase tracking-wide text-teal-700">
              // Architecture
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-normal text-slate-950">
              Built With Modern Tools.
            </h2>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {stackGroups.map((group) => {
              const Icon = group.icon;
              return (
                <article
                  key={group.title}
                  className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/50"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-md border ${group.tone}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-2xl font-extrabold tracking-normal text-slate-950">
                      {group.title}
                    </h3>
                  </div>
                  <div className="mt-7 flex flex-wrap gap-3">
                    {group.tags.map((tag, index) => (
                      <span
                        key={tag}
                        className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${
                          index === 0
                            ? "bg-blue-50 text-blue-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}

