import Link from "next/link";
import { cn } from "@/lib/utils";
import { LOGO_H, LOGO_PATHS, LOGO_W } from "./logo-path";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox={`0 0 ${LOGO_W} ${LOGO_H}`} className={cn("h-4 w-auto", className)} fill="white" aria-hidden>
      {LOGO_PATHS.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" aria-label="Upforward home" className={cn("flex items-center gap-3", className)}>
      <LogoMark className="h-7" />
      <span className="text-[19px] font-semibold tracking-tight">Upforward</span>
    </Link>
  );
}
