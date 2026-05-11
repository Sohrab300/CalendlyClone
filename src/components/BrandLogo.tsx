import React from "react";
import { cn } from "../lib/utils";

type BrandLogoProps = {
  compact?: boolean;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
};

export function BrandLogo({
  compact = false,
  className,
  iconClassName,
  textClassName,
}: BrandLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-600/20",
          iconClassName,
        )}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 40 40"
          className="h-full w-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="40" height="40" rx="9" fill="currentColor" />
          <path
            d="M13 8.5V15.5M27 8.5V15.5"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M8.5 15C8.5 12.7909 10.2909 11 12.5 11H27.5C29.7091 11 31.5 12.7909 31.5 15V31C31.5 33.2091 29.7091 35 27.5 35H12.5C10.2909 35 8.5 33.2091 8.5 31V15Z"
            stroke="white"
            strokeWidth="3"
          />
          <path d="M9.5 20H30.5" stroke="white" strokeWidth="3" />
          <path
            d="M17 29V22H21.25C24.0114 22 26.25 23.567 26.25 25.5C26.25 27.433 24.0114 29 21.25 29H17Z"
            fill="white"
          />
          <path
            d="M20 26.6H21.25C22.493 26.6 23.5 26.1075 23.5 25.5C23.5 24.8925 22.493 24.4 21.25 24.4H20V26.6Z"
            fill="currentColor"
          />
        </svg>
      </span>
      {!compact && (
        <span
          className={cn(
            "text-xl font-extrabold tracking-normal text-blue-700",
            textClassName,
          )}
        >
          DevSchedule
        </span>
      )}
    </span>
  );
}

