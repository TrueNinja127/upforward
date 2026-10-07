import { faqs } from "@/lib/faqs";
import { site } from "@/lib/site";

/*
 * schema.org JSON-LD for the home page. Describes the organization, its
 * services, the site/page and the FAQ so search and AI engines can
 * understand Upforward without parsing the layout.
 *
 * Testimonials are placeholders, so no Review/AggregateRating markup is
 * emitted — add it only once the reviews are real and verifiable.
 */

const org = `${site.url}/#organization`;
const website = `${site.url}/#website`;
const webpage = `${site.url}/#webpage`;

export const homeJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": org,
      name: site.name,
      url: site.url,
      logo: {
        "@type": "ImageObject",
        url: `${site.url}/icon.png`,
        width: 512,
        height: 512,
      },
      image: `${site.url}/opengraph-image`,
      description: site.description,
      slogan: site.tagline,
      email: site.email,
      foundingDate: site.foundingYear,
      areaServed: "Worldwide",
      knowsAbout: site.keywords,
      ...(site.sameAs.length ? { sameAs: site.sameAs } : {}),
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "sales",
        email: site.email,
        availableLanguage: ["English"],
      },
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Software development services",
        itemListElement: site.services.map((s) => ({
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: s.name,
            description: s.description,
            provider: { "@id": org },
            areaServed: "Worldwide",
          },
        })),
      },
    },
    {
      "@type": "WebSite",
      "@id": website,
      url: site.url,
      name: site.name,
      description: site.description,
      inLanguage: "en",
      publisher: { "@id": org },
    },
    {
      "@type": "WebPage",
      "@id": webpage,
      url: site.url,
      name: site.title,
      description: site.description,
      inLanguage: "en",
      isPartOf: { "@id": website },
      about: { "@id": org },
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: `${site.url}/opengraph-image`,
        width: 1200,
        height: 630,
      },
    },
    {
      "@type": "FAQPage",
      "@id": `${site.url}/#faq`,
      isPartOf: { "@id": webpage },
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
};
