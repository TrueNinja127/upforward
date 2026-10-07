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
import { faqs } from "@/lib/faqs";
import { site } from "@/lib/site";

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
          <ChevronLink href={`mailto:${site.email}`} className="mt-6 font-medium">
            {site.email}
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
