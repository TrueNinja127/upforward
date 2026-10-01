"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { ease, Reveal } from "./motion";
import { Container, SectionHeading } from "./section-heading";

const stages: {
  phase: string;
  when: string;
  title: string;
  body: string;
  outputs: string[];
  figure: string;
}[] = [
  {
    phase: "Discover",
    when: "Week 1",
    title: "Read the court.",
    body: "We study your goals, users and constraints until we know exactly what winning looks like.",
    outputs: ["Goals & KPIs", "User research", "Technical audit"],
    figure: "/players/handle.svg",
  },
  {
    phase: "Design",
    when: "Weeks 1–2",
    title: "Make your move.",
    body: "Clickable prototypes and a technical game plan, validated before a line of production code.",
    outputs: ["Prototype", "Architecture", "Fixed-scope plan"],
    figure: "/players/dribble.svg",
  },
  {
    phase: "Build",
    when: "Weeks 2–5",
    title: "Rise up.",
    body: "Weekly releases and live demos. Relentless momentum and full visibility — never a black box.",
    outputs: ["Weekly releases", "Live demos", "Automated tests"],
    figure: "/players/jump.svg",
  },
  {
    phase: "Launch",
    when: "Week 6",
    title: "Slam dunk.",
    body: "A flawless launch. Then we monitor and iterate, or hand off cleanly to your team.",
    outputs: ["Production launch", "Monitoring", "Handoff & docs"],
    figure: "/players/dunk.svg",
  },
];

export function Process() {
  return (
    <section id="process" className="scroll-mt-20 py-24 sm:py-40">
      <Container>
        <SectionHeading
          eyebrow="Process"
          title="Four moves. One clean finish."
          description="A proven playbook refined over 120+ launches. You stay courtside for every move — and your launch stays on schedule."
        />

        <ol className="mt-14 grid gap-4 sm:mt-20 md:grid-cols-2">
          {stages.map((s, i) => (
            <li key={s.phase}>
              <Reveal delay={(i % 2) * 0.08} className="h-full">
                <article className="group relative flex h-full min-h-[480px] flex-col overflow-hidden rounded-[36px] bg-card p-8 pb-56 sm:min-h-[520px] sm:p-10 sm:pb-10">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-3">
                      <span className="flex size-11 items-center justify-center rounded-full bg-white text-[15px] font-semibold text-black tabular-nums">
                        0{i + 1}
                      </span>
                      <span className="text-[17px] font-semibold">{s.phase}</span>
                    </span>
                    <span className="rounded-full bg-black px-4 py-2 text-[14px] text-white/70">{s.when}</span>
                  </div>

                  <div className="relative z-10 mt-12 sm:max-w-[58%]">
                    <h3 className="headline text-[36px] sm:text-[44px]">{s.title}</h3>
                    <p className="mt-4 text-[17px] leading-relaxed text-white/60">{s.body}</p>
                    <ul className="mt-8 flex flex-wrap gap-2">
                      {s.outputs.map((o) => (
                        <li key={o} className="rounded-full bg-black px-4 py-2 text-[14px]">
                          {o}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Corner figure */}
                  <motion.div
                    className="pointer-events-none absolute right-5 bottom-5 h-[190px] w-[58%] sm:right-8 sm:bottom-8 sm:h-[62%] sm:w-[40%]"
                    initial={{ opacity: 0, y: 48 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 1.1, delay: 0.25 + (i % 2) * 0.08, ease }}
                  >
                    <Image
                      src={s.figure}
                      alt=""
                      fill
                      unoptimized
                      className="object-contain object-right-bottom transition-transform duration-700 ease-out group-hover:-translate-y-2"
                    />
                  </motion.div>
                </article>
              </Reveal>
            </li>
          ))}
        </ol>

        <Reveal className="mt-4">
          <div className="flex flex-col items-start justify-between gap-4 rounded-[28px] bg-card px-8 py-6 sm:flex-row sm:items-center sm:rounded-full">
            <p className="text-[17px] text-white/60">
              Tip-off to launch: <span className="font-semibold text-white">6 weeks on average.</span>
            </p>
            <div className="flex w-full items-center gap-2 sm:w-auto">
              {stages.map((s) => (
                <span key={s.phase} className="h-1.5 flex-1 rounded-full bg-white sm:w-16 sm:flex-none" />
              ))}
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
