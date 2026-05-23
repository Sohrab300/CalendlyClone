import React from "react";
import { Menu, X } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { BrandLogo } from "./BrandLogo";

const navItems = [
  { label: "Product", to: "/product" },
  { label: "Features", to: "/features" },
  { label: "Case Studies", to: "/case-studies" },
];

export function MarketingHeader() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  React.useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 md:px-5">
          <Link to="/" aria-label="DevSchedule home">
            <BrandLogo iconClassName="h-8 md:h-10" />
          </Link>

          <div className="hidden items-center gap-8 text-md font-medium text-slate-600 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "border-b-2 py-7 transition hover:text-blue-700",
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

          <div className="hidden items-center gap-3 md:flex">
            <Link
              to="/admin/login"
              className="rounded-full border border-slate-300 px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="rounded-full bg-blue-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700"
            >
              Sign up
            </Link>
          </div>

          <button
            type="button"
            aria-label="Open navigation menu"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center text-slate-800 transition hover:border-slate-300 hover:bg-slate-50 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        </nav>
      </header>

      <div
        className={[
          "fixed inset-0 z-50 bg-slate-950/35 transition-opacity duration-300 md:hidden",
          isMenuOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        ].join(" ")}
        onClick={() => setIsMenuOpen(false)}
      >
        <aside
          className={[
            "ml-auto flex h-dvh w-full min-[500px]:w-[420px] flex-col bg-white shadow-2xl transition-transform duration-300",
            isMenuOpen ? "translate-x-0" : "translate-x-full",
          ].join(" ")}
          aria-label="Mobile navigation"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex h-20 items-center justify-between border-b border-slate-200 px-5">
            <Link
              to="/"
              aria-label="DevSchedule home"
              onClick={() => setIsMenuOpen(false)}
            >
              <BrandLogo iconClassName="h-8 min-[500px]:h-10" />
            </Link>
            <button
              type="button"
              aria-label="Close navigation menu"
              onClick={() => setIsMenuOpen(false)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-1 flex-col px-6 py-8">
            <div className="flex flex-col">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                    [
                      "border-b border-slate-200 py-5 text-lg font-bold transition",
                      isActive
                        ? "text-blue-700"
                        : "text-slate-800 hover:text-blue-700",
                    ].join(" ")
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>

            <div className="mt-auto grid gap-3 pt-8">
              <Link
                to="/admin/login"
                onClick={() => setIsMenuOpen(false)}
                className="flex h-12 items-center justify-center rounded-full border border-slate-300 px-5 text-sm font-bold uppercase tracking-wide text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                onClick={() => setIsMenuOpen(false)}
                className="flex h-12 items-center justify-center rounded-full bg-blue-600 px-5 text-sm font-bold uppercase tracking-wide text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700"
              >
                Sign up
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
