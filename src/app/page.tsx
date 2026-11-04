import { Capabilities } from "@/components/landing/capabilities";
import { Cta } from "@/components/landing/cta";
import { Faq } from "@/components/landing/faq";
import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";
import { Hero } from "@/components/landing/hero";
import { Jobs } from "@/components/landing/jobs";
import { Manifesto } from "@/components/landing/manifesto";
import { MotionProvider } from "@/components/landing/motion";
import { Process } from "@/components/landing/process";
import { Record } from "@/components/landing/record";
import { Testimonial } from "@/components/landing/testimonial";
import { Work } from "@/components/landing/work";
import { homeJsonLd } from "@/lib/structured-data";

// The jobs section reads open roles from the database; re-render at most once a minute.
export const revalidate = 60;

export default function Home() {
  return (
    <MotionProvider>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd).replace(/</g, "\\u003c") }}
      />
      <Header />
      <main className="flex-1">
        <Hero />
        <Manifesto />
        <Capabilities />
        <Process />
        <Record />
        <Work />
        <Testimonial />
        <Jobs />
        <Faq />
        <Cta />
      </main>
      <Footer />
    </MotionProvider>
  );
}
