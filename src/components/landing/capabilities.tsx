"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";
import { cn } from "@/lib/utils";
import { MarkOutline } from "./logo-art";
import { Container, SectionHeading } from "./section-heading";

const capabilities = [
  {
    title: "Web platforms",
    lede: "Products that feel instant and scale without drama.",
    body: "From a focused MVP to enterprise traffic, we build fast, accessible web apps and SaaS platforms on a modern, maintainable stack.",
    deliverables: ["SaaS products", "Customer portals", "Internal tools", "Design systems"],
    stack: "Next.js · React · TypeScript · Node",
  },
  {
    title: "Mobile apps",
    lede: "Native-feeling experiences on every device.",
    body: "Cross-platform and native apps that ship to the App Store and Google Play — and stay fast, stable and well-reviewed after launch.",
    deliverables: ["iOS & Android", "Offline-first sync", "Push & payments", "Store launch"],
    stack: "React Native · Swift · Kotlin",
  },
  {
    title: "AI products",
    lede: "Intelligence that works in production, not just in demos.",
    body: "LLM-powered features, agents and data pipelines designed around real workflows, with evaluation and guardrails built in.",
    deliverables: ["AI assistants", "Document automation", "RAG search", "Model evaluation"],
    stack: "LLMs · Python · Vector search",
  },
  {
    title: "Cloud & DevOps",
    lede: "Infrastructure you never have to think about.",
    body: "Infrastructure as code, CI/CD and observability so your team can deploy every day — calmly, securely and at any scale.",
    deliverables: ["Cloud architecture", "CI/CD pipelines", "Observability", "Cost optimization"],
    stack: "AWS · GCP · Terraform · Kubernetes",
  },
  {
    title: "Product design",
    lede: "Complex software, made to feel effortless.",
    body: "Research, UX and interface design that turn ambitious ideas into products people understand on first use.",
    deliverables: ["UX research", "Prototyping", "Interface design", "Usability testing"],
    stack: "Figma · Prototyping · Research",
  },
];

function Panel({
  item,
  index,
  onActive,
}: {
  item: (typeof capabilities)[number];
  index: number;
  onActive: (i: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.6 });

  useEffect(() => {
    if (inView) onActive(index);
  }, [inView, index, onActive]);

  return (
    <div ref={ref} className="flex items-center py-3 lg:min-h-[80svh] lg:py-0">
      <article className="relative w-full overflow-hidden rounded-[36px] bg-card p-8 sm:p-12">
        <MarkOutline className="absolute -right-24 -bottom-16 w-[460px] opacity-[0.07]" />
        <div className="relative">
          <p className="text-[15px] font-medium text-white/40 tabular-nums">0{index + 1}</p>
          <h3 className="headline mt-3 text-[32px] sm:text-[40px] lg:hidden">{item.title}</h3>
          <p className="headline mt-3 text-[26px] leading-snug text-pretty sm:text-[32px] lg:mt-6">{item.lede}</p>
          <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-white/60">{item.body}</p>
          <ul className="mt-10 grid grid-cols-2 gap-2 sm:max-w-md">
            {item.deliverables.map((d) => (
              <li key={d} className="rounded-2xl bg-black px-4 py-3 text-[15px]">
                {d}
              </li>
            ))}
          </ul>
          <p className="mt-8 text-[14px] text-white/40">{item.stack}</p>
        </div>
      </article>
    </div>
  );
}

export function Capabilities() {
  const [active, setActive] = useState(0);

  return (
    <section id="capabilities" className="scroll-mt-20 py-24 sm:py-40">
      <Container>
        <SectionHeading
          eyebrow="Capabilities"
          title="One team. Every discipline."
          description="Strategy, design, engineering and operations under one roof — so nothing gets lost between hand-offs."
        />

        <div className="mt-16 grid gap-12 lg:mt-8 lg:grid-cols-12">
          {/* Sticky index (desktop) */}
          <div className="hidden lg:col-span-5 lg:block">
            <ul className="sticky top-0 flex h-[100svh] flex-col justify-center gap-1">
              {capabilities.map((c, i) => (
                <li
                  key={c.title}
                  className={cn(
                    "headline text-[52px] transition-colors duration-500",
                    active === i ? "text-white" : "text-white/15"
                  )}
                >
                  {c.title}
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-7">
            {capabilities.map((c, i) => (
              <Panel key={c.title} item={c} index={i} onActive={setActive} />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
