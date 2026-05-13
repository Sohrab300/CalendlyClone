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
  textClassName: _textClassName,
}: BrandLogoProps) {
  if (compact) {
    return (
      <span className={cn("inline-flex items-center", className)}>
        <span
          className={cn(
            "inline-flex h-9 w-9 shrink-0 overflow-hidden rounded-lg",
            iconClassName,
          )}
        >
          <img
            src="/logo_cc.png"
            alt="DevSchedule"
            className="block h-full w-auto max-w-none object-contain object-left"
          />
        </span>
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center", className)}>
      <img
        src="/logo_cc.png"
        alt="DevSchedule"
        className={cn(
          "block h-9 max-w-none object-contain",
          iconClassName,
          "w-auto",
        )}
      />
    </span>
  );
}
