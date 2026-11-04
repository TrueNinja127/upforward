"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { AnimatedMark, LogoEchoes } from "./logo-art";
import { ease } from "./motion";
import { ChevronLink, PillLink } from "./pill-button";

const fade = (delay: number) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 1.2, delay, ease },
});

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const markScale = useTransform(scrollYProgress, [0, 1], [1, 1.35]);
  const fadeOut = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const lift = useTransform(scrollYProgress, [0, 1], [0, -120]);

  return (
    <section ref={ref} className="relative flex min-h-[100svh] items-center overflow-hidden pt-20">
      <motion.div
        style={{ opacity: fadeOut, y: lift }}
        className="relative mx-auto flex w-full max-w-[1280px] flex-col items-center px-5 pt-10 pb-20 text-center sm:px-8"
      >
        <motion.div style={{ scale: markScale }} className="relative w-[min(64vw,560px)]">
          <LogoEchoes />
          <AnimatedMark className="relative w-full" delay={0.2} />
        </motion.div>

        <motion.h1 {...fade(0.35)} className="relative mt-16 sm:mt-20">
          <span className="block text-[17px] font-medium text-white/60 sm:text-[19px]">
            Upforward, senior software engineering team
          </span>
          <span className="headline mt-3 block text-[52px] sm:text-[88px] lg:text-[112px]">
            Built to rise.
          </span>
        </motion.h1>

        <motion.p
          {...fade(0.5)}
          className="relative mt-6 max-w-2xl text-[19px] leading-relaxed text-pretty text-white/65 sm:text-[22px]"
        >
          We design, build and launch web platforms, mobile apps and AI
          products that move companies up and forward.
        </motion.p>

        <motion.div {...fade(0.65)} className="relative mt-10 flex flex-col items-center gap-5 sm:flex-row sm:gap-8">
          <PillLink href="#contact" className="h-14 px-8 text-[17px] font-medium">
            Start a project
          </PillLink>
          <ChevronLink href="#manifesto" className="font-medium">
            Discover Upforward
          </ChevronLink>
        </motion.div>
      </motion.div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 1 }}
        className="absolute bottom-8 left-1/2 hidden h-14 w-px -translate-x-1/2 overflow-hidden bg-white/15 sm:block"
        aria-hidden
      >
        <motion.span
          className="absolute inset-x-0 top-0 h-5 bg-white"
          animate={{ y: [-20, 56] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </section>
  );
}
