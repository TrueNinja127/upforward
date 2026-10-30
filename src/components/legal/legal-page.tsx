import type { ReactNode } from "react";
import Link from "next/link";
import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";
import { MotionProvider } from "@/components/landing/motion";
import { Container } from "@/components/landing/section-heading";

export type LegalSection = { id: string; title: string; body: ReactNode };

/** Long-form legal document: headline, table of contents and numbered sections. */
export function LegalPage({
  eyebrow,
  title,
  lede,
  updated,
  sections,
}: {
  eyebrow: string;
  title: string;
  lede: ReactNode;
  updated: string;
  sections: LegalSection[];
}) {
  return (
    <MotionProvider>
      <Header />
      <main className="flex-1 pt-40 pb-24 sm:pt-48 sm:pb-32">
        <Container>
          <div className="max-w-4xl">
            <p className="text-[17px] font-medium text-white/50">{eyebrow}</p>
            <h1 className="headline mt-4 text-[48px] sm:text-[72px] lg:text-[88px]">{title}</h1>
            <p className="mt-6 max-w-2xl text-[19px] leading-relaxed text-pretty text-white/60 sm:text-[21px]">{lede}</p>
            <p className="mt-6 text-[14px] text-white/40">
              Last updated <time dateTime={updated}>{formatDate(updated)}</time>
            </p>
          </div>

          <div className="mt-20 grid gap-14 lg:grid-cols-12">
            <nav aria-label="Contents" className="lg:col-span-4">
              <div className="rounded-[28px] bg-card p-6 lg:sticky lg:top-28">
                <h2 className="text-[14px] text-white/40">Contents</h2>
                <ol className="mt-4 space-y-2.5">
                  {sections.map((s, i) => (
                    <li key={s.id}>
                      <Link
                        href={`#${s.id}`}
                        className="flex gap-3 text-[15px] text-white/70 transition-colors hover:text-white"
                      >
                        <span className="w-5 shrink-0 text-white/30 tabular-nums">{i + 1}</span>
                        {s.title}
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
            </nav>

            <article className="space-y-14 lg:col-span-8">
              {sections.map((s, i) => (
                <section key={s.id} id={s.id} className="scroll-mt-28">
                  <h2 className="headline text-[28px] sm:text-[34px]">
                    <span className="mr-3 text-white/30 tabular-nums">{i + 1}.</span>
                    {s.title}
                  </h2>
                  <div className="mt-5 space-y-4 text-[17px] leading-relaxed text-pretty text-white/65 [&_a]:text-white [&_a]:underline [&_a]:underline-offset-4 [&_li]:pl-1 [&_strong]:font-medium [&_strong]:text-white [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
                    {s.body}
                  </div>
                </section>
              ))}
            </article>
          </div>
        </Container>
      </main>
      <Footer />
    </MotionProvider>
  );
}

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
