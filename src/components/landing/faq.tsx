import { PlusIcon } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "./motion";
import { ChevronLink } from "./pill-button";
import { Container } from "./section-heading";

const faqs = [
  {
    q: "How much does a typical project cost?",
    a: "Most engagements range from $40k for a focused MVP to $250k+ for complex platforms. After a free discovery call we send a fixed-scope proposal with clear milestones.",
  },
  {
    q: "How fast will we see working software?",
    a: "You'll click through a prototype by the end of week two and see deployed, working software every week after that.",
  },
  {
    q: "Do you work with existing codebases?",
    a: "Yes. Roughly half our work is modernizing, scaling or rescuing existing products. We start with a short technical audit so there are no surprises.",
  },
  {
    q: "Who owns the code and IP?",
    a: "You do — 100%, from the first commit. Everything lives in your repositories and your cloud accounts.",
  },
  {
    q: "Can you support the product after launch?",
    a: "We offer flexible retainers for maintenance, monitoring and new features, or we'll train and hand off to your in-house team.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 py-24 sm:py-40">
      <Container className="grid gap-12 lg:grid-cols-12">
        <Reveal className="lg:col-span-5">
          <p className="text-[17px] font-medium text-white/50">FAQ</p>
          <h2 className="headline mt-4 text-[44px] sm:text-[64px]">Good questions.</h2>
          <p className="mt-6 max-w-sm text-[19px] leading-relaxed text-white/60">
            Anything else on your mind? We&apos;re happy to talk it through.
          </p>
          <ChevronLink href="mailto:hello@upforward.org" className="mt-6 font-medium">
            hello@upforward.org
          </ChevronLink>
        </Reveal>

        <Reveal delay={0.1} className="lg:col-span-7">
          <Accordion className="border-t border-white/15">
            {faqs.map((item) => (
              <AccordionItem key={item.q} value={item.q} className="border-b border-white/15">
                <AccordionTrigger className="items-center gap-6 rounded-none py-7 text-left hover:no-underline **:data-[slot=accordion-trigger-icon]:hidden">
                  <span className="headline flex-1 text-[21px] sm:text-[24px]">{item.q}</span>
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-card transition-colors duration-300 group-aria-expanded/accordion-trigger:bg-white group-aria-expanded/accordion-trigger:text-black">
                    <PlusIcon className="size-4 transition-transform duration-300 group-aria-expanded/accordion-trigger:rotate-45" />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pr-14 pb-8 text-[17px] leading-relaxed text-white/60">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </Container>
    </section>
  );
}
