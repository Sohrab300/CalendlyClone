import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  Code2,
  Database,
  Github,
  Rocket,
  UserRound,
} from "lucide-react";
import { MarketingHeader } from "../components/MarketingHeader";

const githubUrl = "https://github.com/Sohrab300/CalendlyClone";

const highlights = [
  {
    title: "Full-Stack Practice",
    description:
      "Implementing scheduling logic, time zone handling, and database relations across a complete booking flow.",
    icon: Database,
    tone: "bg-blue-50 text-blue-700",
  },
  {
    title: "Real-World UI Cloning",
    description:
      "Recreating a production-style scheduling experience with focused typography, spacing, and interaction states.",
    icon: CalendarDays,
    tone: "bg-teal-50 text-teal-700",
  },
  {
    title: "Learning by Doing",
    description:
      "Turning abstract concepts into a tangible working product through the full lifecycle of a modern web app.",
    icon: Rocket,
    tone: "bg-orange-50 text-orange-700",
  },
];

const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const dates = ["28", "29", "30", "31", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
const slots = ["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM"];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <MarketingHeader />

      <section className="border-b border-slate-100 bg-[radial-gradient(circle_at_top,#eef4ff_0%,#f8faff_38%,#ffffff_72%)]">
        <div className="mx-auto flex min-h-[420px] max-w-4xl flex-col items-center justify-center px-5 py-20 text-center md:px-8">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-600 shadow-sm">
            <Code2 className="h-3.5 w-3.5 text-blue-600" />
            Educational project - not affiliated with Calendly
          </div>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-normal text-slate-950 md:text-5xl">
            Scheduling. Reimagined by a Developer.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
            A Calendly-inspired clone built to master full-stack development
            and high-fidelity UI design.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/product"
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-7 py-3 text-xs font-bold uppercase tracking-wide text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
            >
              Try it out
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/70 px-7 py-3 text-xs font-bold uppercase tracking-wide text-slate-700 transition hover:border-slate-400 hover:bg-white"
            >
              <Github className="h-4 w-4" />
              View source
            </a>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-normal text-slate-950">
              Behind the Code
            </h2>
            <p className="mt-4 text-sm leading-6 text-slate-600 md:text-base">
              The technical challenges and design decisions that shaped this
              educational project.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="rounded-lg border border-slate-200 bg-slate-50/70 p-8 shadow-sm shadow-slate-200/50"
                >
                  <div
                    className={`mb-8 flex h-12 w-12 items-center justify-center rounded-md ${item.tone}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-extrabold tracking-normal text-slate-950">
                    {item.title}
                  </h3>
                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    {item.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-[linear-gradient(180deg,#f7f9ff_0%,#ffffff_100%)] px-5 py-20 md:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-blue-100/70">
            <div className="flex h-11 items-center gap-2 border-b border-slate-200 bg-slate-50 px-4">
              <div className="h-3 w-3 rounded-full bg-slate-300" />
              <div className="h-3 w-3 rounded-full bg-slate-300" />
              <div className="h-3 w-3 rounded-full bg-slate-300" />
              <div className="ml-5 h-6 w-full max-w-md rounded-md border border-slate-200 bg-white text-center text-[10px] leading-6 text-slate-400">
                app.devschedule.edu
              </div>
            </div>

            <div className="grid gap-0 md:grid-cols-[1fr_1.75fr]">
              <aside className="border-b border-slate-100 p-8 md:border-b-0 md:border-r">
                <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                  <UserRound className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-slate-500">
                  Developer User
                </p>
                <h3 className="mt-3 text-2xl font-extrabold tracking-normal text-slate-950">
                  Code Review Session
                </h3>
                <div className="mt-6 flex items-center gap-2 text-sm text-slate-600">
                  <CalendarDays className="h-4 w-4" />
                  30 min
                </div>
                <p className="mt-8 border-t border-slate-100 pt-6 text-sm leading-6 text-slate-600">
                  Educational placeholder text describing the purpose of this
                  mock meeting.
                </p>
              </aside>

              <div className="grid gap-8 p-8 lg:grid-cols-[1.25fr_0.9fr]">
                <div>
                  <h3 className="text-2xl font-extrabold tracking-normal text-slate-950">
                    Select a Date & Time
                  </h3>
                  <div className="mt-7 grid grid-cols-7 gap-y-4 text-center">
                    {days.map((day) => (
                      <div
                        key={day}
                        className="text-[10px] font-bold uppercase tracking-wide text-slate-500"
                      >
                        {day}
                      </div>
                    ))}
                    {dates.map((date) => (
                      <div
                        key={date}
                        className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                          date === "7"
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                            : Number(date) < 1
                              ? "text-slate-300"
                              : "text-slate-800"
                        }`}
                      >
                        {date}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-5 text-center text-sm font-semibold text-slate-700">
                    Thursday, 7th
                  </p>
                  <div className="space-y-3">
                    {slots.map((slot) => (
                      <button
                        key={slot}
                        className="h-11 w-full rounded-md border border-blue-500 bg-blue-50/30 text-sm font-bold text-blue-700 transition hover:bg-blue-50"
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="px-5 py-10 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <Link to="/" className="text-xl font-black tracking-tight text-blue-700">
              DEVSCHEDULE
            </Link>
            <p className="mt-3 text-xs font-semibold text-slate-600">
              © 2026 DevSchedule. Educational Project for Developer Portfolio.
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Built for educational purposes only. Inspired by Calendly.
            </p>
          </div>
          <div className="flex flex-wrap gap-6 text-[11px] font-bold uppercase tracking-wide text-slate-600">
            <Link to="/features" className="hover:text-slate-950">
              Documentation
            </Link>
            <a href={githubUrl} target="_blank" rel="noreferrer" className="hover:text-slate-950">
              Github Repo
            </a>
            <a href="https://www.linkedin.com" target="_blank" rel="noreferrer" className="hover:text-slate-950">
              LinkedIn
            </a>
            <Link to="/product" className="hover:text-slate-950">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

