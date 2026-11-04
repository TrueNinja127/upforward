/** Shared site facts for metadata, structured data and generated images. */
export const site = {
  name: "Upforward",
  // Set NEXT_PUBLIC_SITE_URL to the production domain; used for canonical and share URLs.
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://upforward.org").replace(/\/$/, ""),
  // The admin panel where jobs are managed and applicant chats are answered.
  adminUrl: (process.env.ADMIN_URL ?? "https://admin.upforward.org").replace(/\/$/, ""),
  // ~60 characters so it isn't truncated in search results.
  title: "Upforward | Software Development Company for Web, Mobile & AI",
  tagline: "Built to rise.",
  // ~155 characters: the snippet Google shows under the title.
  description:
    "Senior software engineering team that designs, builds and launches web platforms, mobile apps and AI products, from first call to production in weeks.",
  email: "info@upforward.org",
  foundingYear: "2018",
  // Add real profile URLs (LinkedIn, GitHub, X…) once they exist; they feed structured data.
  sameAs: [] as string[],
  keywords: [
    "software development company",
    "software engineering team",
    "custom software development",
    "web app development",
    "mobile app development",
    "AI product development",
    "MVP development",
    "Next.js development agency",
    "React Native development",
    "cloud and DevOps services",
    "product design studio",
  ],
  services: [
    {
      name: "Web platform development",
      description: "Fast, accessible web apps and SaaS platforms, from MVP to enterprise scale.",
    },
    {
      name: "Mobile app development",
      description: "Native-feeling iOS and Android apps, shipped to the stores and maintained.",
    },
    {
      name: "AI product development",
      description: "LLM features, agents and data pipelines built for production use.",
    },
    {
      name: "Cloud & DevOps",
      description: "Infrastructure as code, CI/CD and observability for daily, reliable deploys.",
    },
    {
      name: "Product design",
      description: "UX research, prototyping and interface design for complex software.",
    },
  ],
};
