import React from "react";
import { Link } from "react-router-dom";

const githubUrl = "https://github.com/Sohrab300/CalendlyClone";

export function Footer() {
  return (
    <footer className="px-5 py-10 md:px-8 border-t border-slate-100 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div>
          <Link
            to="/"
            className="text-xl font-black tracking-tight text-blue-700"
          >
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
          <a
            href={githubUrl}
            target="_blank"
            rel="noreferrer"
            className="hover:text-slate-950"
          >
            Github Repo
          </a>
          <a
            href="https://www.linkedin.com/in/sohrab-sheikh-139166249/"
            target="_blank"
            rel="noreferrer"
            className="hover:text-slate-950"
          >
            LinkedIn
          </a>
          <Link to="/privacy" className="hover:text-slate-950">
            Privacy Policy
          </Link>
          <Link to="/terms" className="hover:text-slate-950">
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
}
