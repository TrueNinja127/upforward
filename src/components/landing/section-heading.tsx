import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "./motion";

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-[1280px] px-5 sm:px-8", className)}>{children}</div>;
}

/** Section intro: small eyebrow, big statement headline, short lede. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  const center = align === "center";
  return (
    <Reveal className={cn("max-w-4xl", center && "mx-auto text-center", className)}>
      {eyebrow && <p className="text-[17px] font-medium text-white/50">{eyebrow}</p>}
      <h2 className="headline mt-4 text-[44px] sm:text-[64px] lg:text-[80px]">{title}</h2>
      {description && (
        <p className={cn("mt-6 max-w-2xl text-[19px] leading-relaxed text-pretty text-white/60 sm:text-[21px]", center && "mx-auto")}>
          {description}
        </p>
      )}
    </Reveal>
  );
}
