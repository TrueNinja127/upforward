import { CountUp, Reveal } from "./motion";
import { Container } from "./section-heading";

const stats = [
  { value: 120, suffix: "+", label: "Products launched", note: "Across web, mobile and AI since 2018." },
  { value: 6, suffix: " wks", label: "Average time to launch", note: "From first call to production." },
  { value: 98, suffix: "%", label: "Client retention", note: "Most clients stay for the next project." },
];

export function Record() {
  return (
    <section className="py-24 sm:py-40">
      <Container>
        <Reveal>
          <p className="text-[17px] font-medium text-white/50">The record</p>
          <h2 className="headline mt-4 max-w-4xl text-[44px] sm:text-[64px] lg:text-[80px]">
            Precision you can measure.
          </h2>
        </Reveal>

        <dl className="mt-16 grid gap-px overflow-hidden rounded-[36px] bg-white/10 sm:mt-24 md:grid-cols-3">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.08} className="bg-black">
              <div className="flex h-full flex-col justify-between gap-16 bg-card p-8 sm:p-10">
                <dd className="headline text-[80px] leading-none sm:text-[104px]">
                  <CountUp value={s.value} suffix={s.suffix} />
                </dd>
                <div>
                  <dt className="text-[19px] font-semibold">{s.label}</dt>
                  <p className="mt-1 text-[15px] text-white/50">{s.note}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </dl>
      </Container>
    </section>
  );
}
