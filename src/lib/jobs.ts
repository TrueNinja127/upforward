import type { JobRole } from "@/lib/supabase/types";

/** Open roles. Shared by the landing section, the job pages, the apply form and structured data. */

export type Job = {
  slug: JobRole;
  title: string;
  summary: string;
  about: string;
  responsibilities: string[];
  skills: string[];
};

export const compensation = {
  headline: "40% of incoming revenue",
  detail:
    "Every role is paid on a revenue-share basis: you receive 40% of the incoming revenue from the work you handle. There is no cap, and payouts follow a fixed monthly schedule.",
};

export const requirements = [
  {
    title: "US citizen",
    detail: "You must be a United States citizen currently living in the US.",
  },
  {
    title: "Own laptop or MacBook",
    detail: "A reliable personal laptop or MacBook with a stable internet connection.",
  },
  {
    title: "Remote access for development",
    detail:
      "You are comfortable providing remote access to your machine so our engineering team can set up and run development tooling.",
  },
];

export const employment = {
  type: "Contract",
  location: "Remote · United States",
  schedule: "Flexible hours",
};

export const jobs: Job[] = [
  {
    slug: "virtual-assistant",
    title: "Virtual Assistant",
    summary:
      "Keep our US clients and engineering team in sync: scheduling, communication and day-to-day coordination.",
    about:
      "You are the organised, friendly voice between Upforward and the people we build for. You will handle inboxes and calendars, keep project notes current and make sure nothing falls through the cracks while our engineers focus on shipping.",
    responsibilities: [
      "Manage email, calendars and meeting scheduling across US time zones.",
      "Prepare short status updates and keep project notes organised.",
      "Coordinate documents, invoices and onboarding paperwork with clients.",
      "Flag anything that needs an engineer's attention and follow it to completion.",
    ],
    skills: [
      "Clear written and spoken English.",
      "Comfortable with Google Workspace, Slack and video calls.",
      "Reliable, discreet and detail-oriented.",
      "Prior assistant, admin or customer-support experience is a plus.",
    ],
  },
  {
    slug: "us-partnership",
    title: "US Partnership",
    summary:
      "Represent Upforward in the US market and help turn conversations into long-term client relationships.",
    about:
      "You will be our local partner on the ground. Using your network and ours, you will open doors with US businesses that need software built, join the first calls, and stay close to the relationship while our team delivers.",
    responsibilities: [
      "Introduce Upforward to US companies and founders who need software built.",
      "Join discovery calls and help shape proposals with our engineering leads.",
      "Act as the local point of contact for contracts, payments and check-ins.",
      "Share market feedback so we keep improving how we work.",
    ],
    skills: [
      "A professional network or sales / partnership experience in the US.",
      "Confident communicator who enjoys building trust.",
      "Basic understanding of how software projects run.",
      "Comfortable with LinkedIn, CRM tools and video calls.",
    ],
  },
  {
    slug: "remote-connector",
    title: "Remote Connector",
    summary:
      "Be the technical bridge: provide and maintain the remote US development environment our engineers work through.",
    about:
      "Our engineers deliver for US clients through secure, US-based development environments. You will provide a machine, keep it online and healthy, and work with our team to make sure access, tooling and updates run smoothly.",
    responsibilities: [
      "Provide a dedicated laptop or MacBook and keep it powered and online.",
      "Set up and maintain secure remote access with our engineering team.",
      "Install updates and tooling when asked, and report any issues quickly.",
      "Join short weekly check-ins with the team.",
    ],
    skills: [
      "Comfortable installing software and following technical instructions.",
      "Stable high-speed internet at home.",
      "Responsive and dependable, with a few hours of availability each week.",
      "No coding experience required. We guide you through everything.",
    ],
  },
];

export const jobRoles = jobs.map((j) => j.slug);

export function getJob(slug: string): Job | undefined {
  return jobs.find((j) => j.slug === slug);
}

export function isJobRole(value: unknown): value is JobRole {
  return typeof value === "string" && jobRoles.includes(value as JobRole);
}

export const applicationStatusLabel: Record<
  "new" | "in_review" | "interview" | "hired" | "declined",
  string
> = {
  new: "New",
  in_review: "In review",
  interview: "Interview",
  hired: "Hired",
  declined: "Declined",
};
