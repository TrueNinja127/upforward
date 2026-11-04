import Link from "next/link";
import { ArrowUpRightIcon } from "lucide-react";
import { requirements, sharedCompensation } from "@/lib/jobs";
import { listOpenJobs } from "@/lib/jobs-db";
import { site } from "@/lib/site";
import { Reveal } from "./motion";
import { Container } from "./section-heading";

/** Open roles, managed from the admin panel. Rendered on the server; the page revalidates every minute. */
export async function Jobs() {
  const jobs = await listOpenJobs();
  const compensation = sharedCompensation(jobs);

  return (
    <section id="jobs" className="scroll-mt-20 py-24 sm:py-40">
      <Container>
        <Reveal className="flex flex-col justify-between gap-10 lg:flex-row lg:items-end">
          <div className="max-w-4xl">
            <p className="text-[17px] font-medium text-white/50">Careers</p>
            <h2 className="headline mt-4 text-[44px] sm:text-[64px] lg:text-[80px]">
              Work with us.
            </h2>
            <p className="mt-6 max-w-2xl text-[19px] leading-relaxed text-pretty text-white/60 sm:text-[21px]">
              We&apos;re hiring US-based partners to help us serve more clients.
              Every role is remote, flexible and paid as a share of the revenue
              you help bring in.
            </p>
          </div>
          {compensation && (
            <div className="shrink-0 rounded-[28px] bg-card px-6 py-5">
              <p className="text-[13px] text-white/50">Compensation</p>
              <p className="headline mt-1 text-[26px] leading-tight sm:text-[30px]">{compensation}</p>
            </div>
          )}
        </Reveal>

        {/* Roles */}
        {jobs.length === 0 ? (
          <Reveal className="mt-14 sm:mt-20">
            <div className="rounded-[36px] bg-card p-8 sm:p-10">
              <p className="headline text-[26px] sm:text-[30px]">No open roles right now.</p>
              <p className="mt-3 max-w-xl text-[16px] leading-relaxed text-white/60">
                New roles appear here as soon as we open them. In the meantime, you&apos;re welcome to introduce yourself at{" "}
                <a href={`mailto:${site.email}`} className="text-white underline underline-offset-4">
                  {site.email}
                </a>
                .
              </p>
            </div>
          </Reveal>
        ) : (
          <div className="mt-14 grid gap-3 sm:mt-20 md:grid-cols-3">
            {jobs.map((job, i) => (
              <Reveal key={job.id} delay={i * 0.08} className="h-full">
                <Link
                  href={`/jobs/${job.slug}`}
                  className="group flex h-full flex-col justify-between rounded-[36px] bg-card p-8 transition-colors hover:bg-white hover:text-black sm:p-10"
                >
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <span className="rounded-full bg-black px-3 py-1.5 text-[12px] font-medium text-white group-hover:bg-black/90">
                        {[job.employment_type, job.location.split("·")[0].trim()].filter(Boolean).join(" · ")}
                      </span>
                      <span className="flex size-11 items-center justify-center rounded-full bg-black text-white transition-transform duration-500 group-hover:rotate-45">
                        <ArrowUpRightIcon className="size-5" />
                      </span>
                    </div>
                    <h3 className="headline mt-10 text-[30px] sm:text-[34px]">
                      {job.title}
                    </h3>
                    <p className="mt-4 text-[16px] leading-relaxed text-white/60 group-hover:text-black/65">
                      {job.summary}
                    </p>
                  </div>
                  <div className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-2 text-[14px] text-white/50 group-hover:text-black/60">
                    {job.compensation_headline && (
                      <span className="font-medium text-white group-hover:text-black">
                        {job.compensation_headline}
                      </span>
                    )}
                    {job.schedule && <span>{job.schedule}</span>}
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        )}

        {/* Requirements */}
        <Reveal delay={0.2} className="mt-3">
          <div className="grid gap-6 rounded-[36px] bg-card p-8 sm:p-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-4">
              <p className="text-[13px] text-white/50">
                Requirements for every role
              </p>
              <p className="headline mt-2 text-[26px] sm:text-[30px]">
                What you&apos;ll need.
              </p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-3 lg:col-span-8">
              {requirements.map((r) => (
                <li
                  key={r.title}
                  className="flex gap-3 rounded-[24px] bg-black p-5"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-black">
                    <r.icon className="size-[18px]" />
                  </span>
                  <span>
                    <span className="block text-[15px] font-semibold">
                      {r.title}
                    </span>
                    <span className="mt-1 block text-[13px] leading-relaxed text-white/50">
                      {r.detail}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
