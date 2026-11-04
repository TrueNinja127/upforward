import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";
import { MotionProvider } from "@/components/landing/motion";
import { Container } from "@/components/landing/section-heading";
import { ApplyForm } from "@/components/jobs/apply-form";
import { jobTags, requirements } from "@/lib/jobs";
import { getOpenJob, listOpenJobs } from "@/lib/jobs-db";
import { site } from "@/lib/site";

// Roles are managed in the admin panel; re-render at most once a minute so edits show up without a deploy.
export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  const jobs = await listOpenJobs();
  return jobs.map((job) => ({ slug: job.slug }));
}

export async function generateMetadata({ params }: PageProps<"/jobs/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const job = await getOpenJob(slug);
  if (!job) return {};
  const title = `${job.title} (Remote, US)`;
  const description = [job.summary, job.compensation_headline, `Apply to join ${site.name}.`].filter(Boolean).join(" ");
  return {
    title,
    description,
    alternates: { canonical: `/jobs/${job.slug}` },
    openGraph: { url: `/jobs/${job.slug}`, title: `${title} · ${site.name}`, description: job.summary },
  };
}

export default async function JobPage({ params }: PageProps<"/jobs/[slug]">) {
  const { slug } = await params;
  const [job, openJobs] = await Promise.all([getOpenJob(slug), listOpenJobs()]);
  if (!job) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: `<p>${job.about}</p>${job.compensation_headline ? `<p>Compensation: ${job.compensation_headline}. ${job.compensation_detail}</p>` : ""}`,
    datePosted: job.created_at.slice(0, 10),
    employmentType: job.employment_type.toLowerCase().includes("contract") ? "CONTRACTOR" : job.employment_type.toUpperCase().replace(/[^A-Z_]/g, "_"),
    hiringOrganization: { "@type": "Organization", name: site.name, sameAs: site.url, logo: `${site.url}/icon.png` },
    jobLocationType: "TELECOMMUTE",
    applicantLocationRequirements: { "@type": "Country", name: "United States" },
    qualifications: requirements.map((r) => r.title).join("; "),
    directApply: true,
    url: `${site.url}/jobs/${job.slug}`,
  };

  return (
    <MotionProvider>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Header />
      <main className="flex-1 pt-32 pb-24 sm:pt-40 sm:pb-32">
        <Container>
          <Link
            href="/#jobs"
            className="inline-flex items-center gap-1.5 text-[15px] text-white/60 transition-colors hover:text-white"
          >
            <ArrowLeftIcon className="size-4" /> All open roles
          </Link>

          <div className="mt-8 max-w-4xl">
            <p className="text-[17px] font-medium text-white/50">Open role</p>
            <h1 className="headline mt-4 text-[48px] sm:text-[72px] lg:text-[88px]">{job.title}</h1>
            <p className="mt-6 max-w-2xl text-[19px] leading-relaxed text-pretty text-white/60 sm:text-[21px]">
              {job.summary}
            </p>
            <ul className="mt-8 flex flex-wrap gap-2 text-[14px]">
              {jobTags(job).map((tag) => (
                <li key={tag} className="rounded-full bg-card px-4 py-2">
                  {tag}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-16 grid gap-10 lg:grid-cols-12 lg:gap-14">
            {/* Description */}
            <article className="space-y-14 lg:col-span-7">
              <Section title="About the role">
                <p className="whitespace-pre-line">{job.about}</p>
              </Section>
              {job.responsibilities.length > 0 && (
                <Section title="What you'll do">
                  <List items={job.responsibilities} />
                </Section>
              )}
              {job.skills.length > 0 && (
                <Section title="What we're looking for">
                  <List items={job.skills} />
                </Section>
              )}
              <Section title="Requirements">
                <ul className="grid gap-3 sm:grid-cols-3">
                  {requirements.map((r) => (
                    <li key={r.title} className="rounded-[24px] bg-card p-5">
                      <span className="flex size-10 items-center justify-center rounded-full bg-white text-black">
                        <r.icon className="size-[18px]" />
                      </span>
                      <span className="mt-4 block text-[15px] font-semibold">{r.title}</span>
                      <span className="mt-1 block text-[13px] leading-relaxed text-white/50">{r.detail}</span>
                    </li>
                  ))}
                </ul>
              </Section>
              {job.compensation_headline && (
                <Section title="Compensation">
                  <div className="rounded-[28px] bg-card p-6 sm:p-8">
                    <p className="headline text-[40px] sm:text-[52px]">{job.compensation_headline}</p>
                    {job.compensation_detail && (
                      <p className="mt-3 text-[16px] leading-relaxed text-white/60">{job.compensation_detail}</p>
                    )}
                  </div>
                </Section>
              )}
              <Section title="How it works">
                <ol className="space-y-4">
                  {[
                    "Apply with the short form on this page. It takes about a minute.",
                    "You land in a private chat with our team right away, so you can ask questions and we can learn about you.",
                    "We schedule a quick intro call, agree on the details and get you set up.",
                  ].map((step, i) => (
                    <li key={step} className="flex gap-4">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-card text-[13px] font-semibold tabular-nums">
                        {i + 1}
                      </span>
                      <p className="pt-1">{step}</p>
                    </li>
                  ))}
                </ol>
              </Section>
            </article>

            {/* Apply */}
            <aside className="lg:col-span-5">
              <div className="relative rounded-[36px] bg-card p-6 sm:p-8 lg:sticky lg:top-28">
                <h2 className="headline text-[28px]">Apply for this role</h2>
                <p className="mt-2 text-[15px] text-white/50">We reply to every application, usually the same day.</p>
                <div className="mt-6">
                  <ApplyForm role={job.slug} jobs={openJobs.map((j) => ({ slug: j.slug, title: j.title }))} />
                </div>
              </div>
            </aside>
          </div>
        </Container>
      </main>
      <Footer />
    </MotionProvider>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="headline text-[28px] sm:text-[32px]">{title}</h2>
      <div className="mt-5 text-[17px] leading-relaxed text-white/70">{children}</div>
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span className="mt-[11px] size-1.5 shrink-0 rounded-full bg-white" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
