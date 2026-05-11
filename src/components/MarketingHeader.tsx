import React from "react";
import { Link, NavLink } from "react-router-dom";
import { BrandLogo } from "./BrandLogo";

const navItems = [
  { label: "Product", to: "/product" },
  { label: "Features", to: "/features" },
  { label: "Case Studies", to: "/case-studies" },
];

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-5">
        <Link to="/" aria-label="DevSchedule home">
          <BrandLogo iconClassName="h-8 w-8" />
        </Link>

        <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "border-b-2 py-4 transition hover:text-blue-700",
                  isActive
                    ? "border-blue-600 text-blue-700"
                    : "border-transparent text-slate-600",
                ].join(" ")
              }
              end={item.to === "/"}
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/login"
            className="rounded-full border border-slate-300 px-5 py-2 text-xs font-bold uppercase tracking-wide text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          >
            Log in
          </Link>
          <Link
            to="/signup"
            className="rounded-full bg-blue-600 px-5 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700"
          >
            Sign up
          </Link>
        </div>
      </nav>
    </header>
  );
}
