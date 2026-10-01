import { MarkOutline } from "./logo-art";
import { Container, SectionHeading } from "./section-heading";

const caseStudies = [
  {
    client: "Northwind Logistics",
    industry: "Logistics · Web platform",
    title: "A real-time fleet platform for 4,000 trucks.",
    body: "We replaced a decade-old dispatch system with a live operations platform — routing, tracking and driver messaging in one place.",
    metric: "−40%",
    metricLabel: "dispatch time",
    tags: ["Next.js", "Go", "AWS"],
  },
  {
    client: "Lumen Health",
    industry: "Healthcare · Mobile",
    title: "A patient companion app people actually use.",
    body: "A HIPAA-compliant iOS and Android app for appointments, care plans and secure messaging — rated 4.8 on both stores.",
    metric: "250K",
    metricLabel: "monthly active users",
    tags: ["React Native", "HIPAA", "GCP"],
  },
  {
    client: "Vertex Finance",
    industry: "Finance · AI",
    title: "AI document review for an analyst team.",
    body: "An LLM pipeline that reads, extracts and flags risk across thousands of filings, with human review built into every step.",
    metric: "12 hrs",
    metricLabel: "saved per analyst, weekly",
    tags: ["LLMs", "Python", "RAG"],
  },
];

export function Work() {
  return (
    <section id="work" className="scroll-mt-20 py-24 sm:py-40">
      <Container>
        <SectionHeading
          eyebrow="Selected work"
          title="Launched. Measured. Proven."
          description="A few of the products we've taken from first sketch to production."
        />

        {/* Cards stack on top of each other as you scroll */}
        <div className="mt-16 sm:mt-24">
          {caseStudies.map((c, i) => (
            <article
              key={c.client}
              className="sticky mb-6 overflow-hidden rounded-[36px] bg-card shadow-[0_-24px_48px_rgba(0,0,0,0.6)] sm:rounded-[40px]"
              style={{ top: `calc(104px + ${i * 28}px)` }}
            >
              <MarkOutline className="absolute -right-32 -bottom-24 w-[720px] opacity-[0.06]" />
              <div className="relative grid min-h-[560px] gap-12 p-8 sm:p-12 lg:grid-cols-2 lg:p-16">
                <div className="flex flex-col">
                  <p className="text-[15px] text-white/50">
                    <span className="font-semibold text-white">{c.client}</span> · {c.industry}
                  </p>
                  <h3 className="headline mt-6 text-[32px] leading-[1.1] text-pretty sm:text-[44px]">{c.title}</h3>
                  <p className="mt-5 max-w-md text-[17px] leading-relaxed text-white/60">{c.body}</p>
                  <ul className="mt-auto flex flex-wrap gap-2 pt-10">
                    {c.tags.map((t) => (
                      <li key={t} className="rounded-full bg-black px-4 py-2 text-[14px]">
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col justify-end lg:items-end lg:text-right">
                  <p className="headline text-[96px] leading-none sm:text-[140px]">{c.metric}</p>
                  <p className="mt-3 text-[19px] text-white/60">{c.metricLabel}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
