"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { LOGO_H, LOGO_PATHS, LOGO_W } from "./logo-path";
import { ease } from "./motion";

const CX = LOGO_W / 2;
const CY = LOGO_H / 2;
const aroundCenter = (s: number) => `translate(${CX} ${CY}) scale(${s}) translate(${-CX} ${-CY})`;

/** The UF mark tracing its own outline, then filling in. */
export function AnimatedMark({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <svg viewBox={`0 0 ${LOGO_W} ${LOGO_H}`} className={cn("overflow-visible", className)} aria-hidden>
      {LOGO_PATHS.map((d, i) => (
        <motion.path
          key={i}
          d={d}
          fill="white"
          stroke="white"
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0, fillOpacity: 0 }}
          animate={{ pathLength: 1, fillOpacity: 1 }}
          transition={{
            pathLength: { duration: 2.2, delay: delay + i * 0.35, ease },
            fillOpacity: { duration: 1.2, delay: delay + 1.5 + i * 0.2, ease },
          }}
        />
      ))}
    </svg>
  );
}

/**
 * Contour "echoes" of the UF mark radiating outward — the brand's background
 * motif. Rendered centered on its parent; each entry in `scales` adds one
 * echo at that multiple of the mark's size.
 */
export function LogoEchoes({
  className,
  scales = [1.55, 2.4, 3.5],
  animateIn = true,
}: {
  className?: string;
  scales?: number[];
  animateIn?: boolean;
}) {
  const span = 5.2;
  const vbW = LOGO_W * span;
  const vbH = LOGO_H * span;
  return (
    <svg
      viewBox={`${CX - vbW / 2} ${CY - vbH / 2} ${vbW} ${vbH}`}
      className={cn("pointer-events-none absolute top-1/2 left-1/2 w-[520%] max-w-none -translate-x-1/2 -translate-y-1/2", className)}
      fill="none"
      stroke="white"
      aria-hidden
    >
      {scales.map((s, i) => (
        <g key={s} transform={aroundCenter(s)}>
          {LOGO_PATHS.map((d, j) => (
            <motion.path
              key={j}
              d={d}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              strokeOpacity={0.1 - i * 0.025}
              initial={animateIn ? { pathLength: 0 } : false}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 2.6, delay: 0.4 + i * 0.18, ease }}
            />
          ))}
        </g>
      ))}
    </svg>
  );
}

/** Large outline of the mark, used as a cropped accent inside cards. */
export function MarkOutline({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${LOGO_W} ${LOGO_H}`}
      className={cn("pointer-events-none overflow-visible", className)}
      fill="none"
      stroke="white"
      aria-hidden
    >
      {LOGO_PATHS.map((d, i) => (
        <path key={i} d={d} strokeWidth={1} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}
