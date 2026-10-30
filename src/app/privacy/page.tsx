import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/legal/legal-page";
import { site } from "@/lib/site";

const description = `How ${site.name} collects, uses and protects personal information when you visit our website or work with us.`;

export const metadata: Metadata = {
  title: "Privacy Policy",
  description,
  alternates: { canonical: "/privacy" },
  openGraph: { url: "/privacy", title: `Privacy Policy · ${site.name}`, description },
};

const mail = <a href={`mailto:${site.email}`}>{site.email}</a>;

const sections: LegalSection[] = [
  {
    id: "who-we-are",
    title: "Who we are",
    body: (
      <>
        <p>
          {site.name} (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is a software development company that
          designs, builds and launches web platforms, mobile apps and AI products. This policy explains how we handle
          personal information collected through {site.url.replace(/^https?:\/\//, "")} (the &ldquo;Site&rdquo;) and
          in the course of providing our services.
        </p>
        <p>For any privacy question or request, contact us at {mail}.</p>
      </>
    ),
  },
  {
    id: "information-we-collect",
    title: "Information we collect",
    body: (
      <>
        <p>We collect only what we need to respond to you and to deliver our work:</p>
        <ul>
          <li>
            <strong>Information you give us</strong> — such as your name, work email, company, and the project details
            you share when you submit a form, email us or book a call.
          </li>
          <li>
            <strong>Client engagement information</strong> — contact details of your team, contracts, invoices and
            communications exchanged while we work together.
          </li>
          <li>
            <strong>Technical information</strong> — standard data your browser sends when you visit the Site, such as
            IP address, browser type, device, referring page and pages viewed, which our hosting provider may record
            in server logs.
          </li>
        </ul>
        <p>
          We do not knowingly collect sensitive personal information, and we do not sell or buy personal data.
        </p>
      </>
    ),
  },
  {
    id: "how-we-use-it",
    title: "How we use information",
    body: (
      <>
        <p>We use personal information to:</p>
        <ul>
          <li>reply to enquiries and prepare proposals;</li>
          <li>plan, deliver and support the projects we are engaged for;</li>
          <li>send invoices and manage our business relationship with you;</li>
          <li>keep the Site secure, diagnose problems and understand how it is used;</li>
          <li>comply with legal, tax and accounting obligations.</li>
        </ul>
        <p>
          Where data protection law requires a legal basis, we rely on taking steps at your request before entering a
          contract, performing a contract, our legitimate interest in running and improving our business, your
          consent where we ask for it, and compliance with legal obligations.
        </p>
      </>
    ),
  },
  {
    id: "sharing",
    title: "How we share information",
    body: (
      <>
        <p>We share personal information only when necessary, with:</p>
        <ul>
          <li>
            <strong>Service providers</strong> who help us operate — for example hosting, email, scheduling,
            project-management and accounting tools — under contracts that limit their use of the data;
          </li>
          <li>
            <strong>Professional advisers</strong> such as lawyers and accountants, under duties of confidentiality;
          </li>
          <li>
            <strong>Authorities</strong> where required by law or to protect our rights, users or the public;
          </li>
          <li>
            <strong>A successor business</strong> if we are involved in a merger, acquisition or sale of assets.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "client-data",
    title: "Data we process for clients",
    body: (
      <p>
        When we build or maintain software for a client, we may access personal data belonging to that client&apos;s
        users. In that case we act as a processor on the client&apos;s behalf: we handle the data only on their
        instructions and under the confidentiality and data-processing terms of our agreement. Questions about that
        data should go to the client who controls it.
      </p>
    ),
  },
  {
    id: "cookies",
    title: "Cookies",
    body: (
      <p>
        The Site uses only the cookies and similar storage strictly needed for it to work. If we introduce analytics
        or other non-essential cookies, we will update this policy and, where the law requires it, ask for your
        consent first. You can block or delete cookies in your browser settings.
      </p>
    ),
  },
  {
    id: "retention",
    title: "How long we keep it",
    body: (
      <p>
        We keep enquiry data for as long as needed to respond and follow up, and client records for the length of the
        engagement plus any period required for legal, tax or accounting purposes. When information is no longer
        needed, we delete or anonymise it.
      </p>
    ),
  },
  {
    id: "security",
    title: "Security",
    body: (
      <p>
        We protect personal information with technical and organisational measures appropriate to the risk,
        including encryption in transit, access controls and least-privilege permissions. No method of transmission
        or storage is completely secure, but we work to keep your information safe and will notify you of a breach
        where the law requires.
      </p>
    ),
  },
  {
    id: "international-transfers",
    title: "International transfers",
    body: (
      <p>
        We work with clients and service providers around the world, so your information may be processed in
        countries other than your own. Where required, we use appropriate safeguards — such as standard contractual
        clauses — to protect it.
      </p>
    ),
  },
  {
    id: "your-rights",
    title: "Your rights",
    body: (
      <>
        <p>
          Depending on where you live, you may have the right to access, correct, delete or receive a copy of your
          personal information, to object to or restrict certain processing, and to withdraw consent at any time.
        </p>
        <p>
          To make a request, email {mail}. We will respond within the time required by law and may need to verify
          your identity first. You also have the right to complain to your local data protection authority.
        </p>
      </>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <p>
        Our Site and services are intended for businesses and are not directed at children under 16. We do not
        knowingly collect their personal information; if you believe we have, contact us and we will delete it.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        We may update this policy from time to time. The &ldquo;Last updated&rdquo; date at the top shows when it
        last changed, and we will highlight significant changes on the Site or by email where appropriate.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact us",
    body: <p>If you have questions about this policy or how we handle your information, email us at {mail}.</p>,
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      lede={`Your trust matters. Here's what information ${site.name} collects, why we collect it, and the choices you have.`}
      updated="2026-10-30"
      sections={sections}
    />
  );
}
