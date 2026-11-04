import type { MetadataRoute } from "next";
import { listOpenJobs } from "@/lib/jobs-db";
import { site } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const jobs = await listOpenJobs();
  return [
    {
      url: site.url,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    ...jobs.map((job) => ({
      url: `${site.url}/jobs/${job.slug}`,
      lastModified: new Date(job.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...["/privacy", "/terms"].map((path) => ({
      url: `${site.url}${path}`,
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
