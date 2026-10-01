/** Shared site facts for metadata, structured data and generated images. */
export const site = {
  name: "Upforward",
  // Set NEXT_PUBLIC_SITE_URL to the production domain; used for canonical and share URLs.
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://upforward.org").replace(/\/$/, ""),
  title: "Upforward — Senior software engineering team",
  tagline: "Built to rise.",
  description:
    "Upforward is a senior software engineering team that designs, builds and launches web platforms, mobile apps and AI products — with flawless execution, in weeks, not quarters.",
  email: "hello@upforward.org",
  keywords: [
    "software development company",
    "software engineering team",
    "web app development",
    "mobile app development",
    "AI product development",
    "Next.js development",
    "React Native development",
    "cloud and DevOps",
    "product design",
    "MVP development",
  ],
};
