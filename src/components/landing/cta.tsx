import { LogoEchoes } from "./logo-art";
import { LogoMark } from "./logo";
import { Reveal } from "./motion";
import { pillButton } from "./pill-button";
import { Container } from "./section-heading";

export function Cta() {
  return (
    <section id="contact" className="relative flex min-h-[100svh] scroll-mt-0 items-center overflow-hidden py-32">
      <Container className="relative flex flex-col items-center text-center">
        <div className="relative w-[min(40vw,280px)]">
          <LogoEchoes scales={[1.7, 2.7, 4]} />
          <LogoMark className="relative h-auto w-full" />
        </div>

        <Reveal className="relative mt-20">
          <h2 className="headline text-[52px] sm:text-[88px] lg:text-[112px]">Let&apos;s rise.</h2>
          <p className="mx-auto mt-6 max-w-xl text-[19px] leading-relaxed text-pretty text-white/65 sm:text-[22px]">
            Tell us what you&apos;re building. We&apos;ll reply within one business day
            with a clear plan — free, with no obligation.
          </p>

          {/* TODO: wire up to a form handler / email service */}
          <form className="mx-auto mt-10 flex max-w-lg flex-col gap-2 rounded-[28px] bg-card p-2 sm:flex-row sm:rounded-full">
            <label htmlFor="cta-email" className="sr-only">
              Work email
            </label>
            <input
              id="cta-email"
              type="email"
              required
              placeholder="Your work email"
              className="h-14 flex-1 rounded-full bg-transparent px-6 text-[17px] outline-none placeholder:text-white/40"
            />
            <button type="submit" className={pillButton({ className: "h-14 px-8 font-medium" })}>
              Start a project
            </button>
          </form>
          <p className="mt-5 text-[14px] text-white/40">Free 30-minute call · Fixed-scope proposal · NDA on request</p>
        </Reveal>
      </Container>
    </section>
  );
}
