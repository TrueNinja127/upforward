import { Capabilities } from "@/components/landing/capabilities";
import { Cta } from "@/components/landing/cta";
import { Faq } from "@/components/landing/faq";
import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";
import { Hero } from "@/components/landing/hero";
import { Manifesto } from "@/components/landing/manifesto";
import { MotionProvider } from "@/components/landing/motion";
import { Process } from "@/components/landing/process";
import { Record } from "@/components/landing/record";
import { Testimonial } from "@/components/landing/testimonial";
import { Work } from "@/components/landing/work";
import { site } from "@/lib/site";

// Structured data so search engines understand who Upforward is.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${site.url}/#organization`,
      name: site.name,
      url: site.url,
      logo: `${site.url}/icon.png`,
      email: site.email,
      description: site.description,
    },
    {
      "@type": "WebSite",
      "@id": `${site.url}/#website`,
      url: site.url,
      name: site.name,
      publisher: { "@id": `${site.url}/#organization` },
    },
  ],
};

export default function Home() {
  return (
    <MotionProvider>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
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
        <Faq />
        <Cta />
      </main>
      <Footer />
    </MotionProvider>
  );
}
