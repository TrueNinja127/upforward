"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { Container } from "./section-heading";

const TEXT =
  "We are a senior engineering team for companies that refuse to stand still. We study the play, move with precision and finish every project cleanly — so your product doesn't just launch. It rises.";

const words = TEXT.split(" ");

function Word({ word, index, progress }: { word: string; index: number; progress: MotionValue<number> }) {
  const start = index / words.length;
  const end = start + 1 / words.length;
  const opacity = useTransform(progress, [start, end], [0.16, 1]);
  return (
    <motion.span style={{ opacity }} className="inline-block pr-[0.25em]">
      {word}
    </motion.span>
  );
}

export function Manifesto() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const progress = useTransform(scrollYProgress, [0.05, 0.85], [0, 1]);

  return (
    <section id="manifesto" ref={ref} className="relative h-[260vh]">
      <div className="sticky top-0 flex h-[100svh] items-center">
        <Container>
          <p className="mb-8 text-[17px] font-medium text-white/50">Our philosophy</p>
          <p className="headline max-w-5xl text-[34px] leading-[1.15] sm:text-[52px] lg:text-[64px]">
            {words.map((w, i) => (
              <Word key={i} word={w} index={i} progress={progress} />
            ))}
          </p>
        </Container>
      </div>
    </section>
  );
}
