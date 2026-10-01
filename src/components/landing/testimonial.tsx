"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { ease, Reveal } from "./motion";
import { Container } from "./section-heading";

const AUTOPLAY_SECONDS = 8;

const testimonials = [
  {
    name: "Maya Chen",
    role: "CTO",
    company: "Northwind Logistics",
    avatar: "/avatars/maya-chen.webp",
    quote: "Upforward rebuilt our core platform in four months. We ship twice as often now — and sleep better doing it.",
    result: "2× release frequency",
  },
  {
    name: "Ethan Park",
    role: "VP Engineering",
    company: "Vertex Finance",
    avatar: "/avatars/ethan-park.webp",
    quote: "Their AI team turned a vague idea into the feature our customers now can't live without.",
    result: "12 hrs saved per analyst, weekly",
  },
  {
    name: "Amira Saleh",
    role: "Head of Product",
    company: "Lumen Health",
    avatar: "/avatars/amira-saleh.webp",
    quote: "They felt like part of our company from day one — honest about trade-offs and obsessed with quality.",
    result: "4.8 App Store rating",
  },
  {
    name: "Omar Haddad",
    role: "Founder & CEO",
    company: "Halcyon",
    avatar: "/avatars/omar-haddad.webp",
    quote: "We went from a napkin sketch to paying customers in six weeks. I've never seen a team execute like this.",
    result: "6 weeks to launch",
  },
  {
    name: "Leo Tanaka",
    role: "Head of Platform",
    company: "Monolith",
    avatar: "/avatars/leo-tanaka.webp",
    quote: "Our infrastructure finally runs itself. Deploys went from a monthly ritual to something we do every day.",
    result: "30× more deploys",
  },
  {
    name: "Marcus Reed",
    role: "COO",
    company: "Arcadia",
    avatar: "/avatars/marcus-reed.webp",
    quote: "Weekly demos meant we always knew exactly where things stood. Zero surprises on launch day.",
    result: "0 launch-day incidents",
  },
];

function Avatar({ src, name, className }: { src: string; name: string; className?: string }) {
  return (
    <span className={cn("relative block shrink-0 overflow-hidden rounded-full bg-card", className)}>
      <Image src={src} alt={name} fill sizes="64px" className="object-cover grayscale" />
    </span>
  );
}

export function Testimonial() {
  const [index, setIndex] = useState(0);
  const reduce = useReducedMotion();
  const t = testimonials[index];
  const count = testimonials.length;

  const go = (i: number) => setIndex((i + count) % count);

  return (
    <section id="testimonials" className="scroll-mt-20 py-24 sm:py-40">
      <Container>
        {/* Header */}
        <Reveal className="flex flex-col justify-between gap-10 lg:flex-row lg:items-end">
          <div>
            <p className="text-[17px] font-medium text-white/50">In their words</p>
            <h2 className="headline mt-4 max-w-4xl text-[44px] sm:text-[64px] lg:text-[72px]">
              Trusted by teams who ship.
            </h2>
          </div>
          <div className="flex items-center gap-5">
            <div className="flex -space-x-3">
              {testimonials.map((p) => (
                <Avatar key={p.name} src={p.avatar} name="" className="size-11 ring-4 ring-black" />
              ))}
            </div>
            <div>
              <p className="headline text-[28px] leading-none">4.9 / 5</p>
              <p className="mt-1 text-[14px] text-white/50">Average client rating</p>
            </div>
          </div>
        </Reveal>

        {/* Featured */}
        <Reveal delay={0.1} className="mt-14 sm:mt-20">
          <div className="grid overflow-hidden rounded-[40px] bg-card lg:grid-cols-12">
            <div className="relative aspect-[4/3] sm:aspect-[16/10] lg:col-span-5 lg:aspect-auto lg:min-h-[560px]">
              <AnimatePresence initial={false}>
                <motion.div
                  key={t.avatar}
                  className="absolute inset-0"
                  initial={{ opacity: 0, scale: 1.06 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.9, ease }}
                >
                  <Image
                    src={t.avatar}
                    alt={`${t.name}, ${t.role} at ${t.company}`}
                    fill
                    sizes="(min-width: 1024px) 520px, 100vw"
                    className="object-cover object-top grayscale"
                  />
                </motion.div>
              </AnimatePresence>
              <span className="absolute bottom-5 left-5 rounded-full bg-black/70 px-4 py-2 text-[14px] font-medium backdrop-blur-md">
                {t.company}
              </span>
            </div>

            <div className="flex flex-col p-8 sm:p-12 lg:col-span-7 lg:p-16">
              <svg viewBox="0 0 48 36" className="h-8 w-auto self-start fill-white" aria-hidden>
                <path d="M0 36V22C0 9.6 6.2 2.3 18.6 0l2 4.6C13.4 6.6 9.9 10.7 9.4 17H19v19H0Zm28 0V22C28 9.6 34.2 2.3 46.6 0l2 4.6c-7.2 2-10.7 6.1-11.2 12.4H47v19H28Z" />
              </svg>

              <div className="mt-8 min-h-[220px] flex-1 sm:min-h-[200px]">
                <AnimatePresence mode="wait">
                  <motion.figure
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.55, ease }}
                  >
                    <blockquote className="headline text-[28px] leading-[1.2] text-pretty sm:text-[36px] lg:text-[40px]">
                      {t.quote}
                    </blockquote>
                    <figcaption className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3">
                      <span>
                        <span className="block text-[17px] font-semibold">{t.name}</span>
                        <span className="block text-[15px] text-white/50">
                          {t.role}, {t.company}
                        </span>
                      </span>
                      <span className="rounded-full bg-black px-4 py-2 text-[14px] font-medium sm:ml-auto">
                        {t.result}
                      </span>
                    </figcaption>
                  </motion.figure>
                </AnimatePresence>
              </div>

              <div className="mt-10 flex items-center justify-between border-t border-white/10 pt-6">
                <p className="text-[15px] text-white/50 tabular-nums">
                  <span className="text-white">{String(index + 1).padStart(2, "0")}</span> / {String(count).padStart(2, "0")}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => go(index - 1)}
                    aria-label="Previous testimonial"
                    className="flex size-12 items-center justify-center rounded-full bg-black transition-colors hover:bg-white hover:text-black"
                  >
                    <ArrowLeftIcon className="size-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => go(index + 1)}
                    aria-label="Next testimonial"
                    className="flex size-12 items-center justify-center rounded-full bg-black transition-colors hover:bg-white hover:text-black"
                  >
                    <ArrowRightIcon className="size-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Selector */}
        <Reveal delay={0.15}>
          <ul className="no-scrollbar mt-4 flex gap-2 overflow-x-auto lg:grid lg:grid-cols-6">
            {testimonials.map((p, i) => {
              const active = i === index;
              return (
                <li key={p.name} className="min-w-[200px] lg:min-w-0">
                  <button
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-current={active}
                    aria-label={`Show testimonial from ${p.name}`}
                    className={cn(
                      "relative flex w-full items-center gap-3 overflow-hidden rounded-[22px] p-3 text-left transition-colors duration-500",
                      active ? "bg-card" : "hover:bg-card/60"
                    )}
                  >
                    <Avatar
                      src={p.avatar}
                      name=""
                      className={cn("size-12 transition-opacity duration-500", !active && "opacity-50")}
                    />
                    <span className="min-w-0">
                      <span className={cn("block truncate text-[15px] font-semibold transition-colors", !active && "text-white/50")}>
                        {p.name}
                      </span>
                      <span className="block truncate text-[13px] text-white/40">{p.company}</span>
                    </span>

                    {/* Autoplay progress */}
                    {active && !reduce && (
                      <motion.span
                        key={index}
                        className="absolute inset-x-3 bottom-0 h-0.5 origin-left rounded-full bg-white"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: AUTOPLAY_SECONDS, ease: "linear" }}
                        onAnimationComplete={() => go(index + 1)}
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </Reveal>
      </Container>
    </section>
  );
}
