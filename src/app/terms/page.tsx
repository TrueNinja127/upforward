import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/legal/legal-page";
import { site } from "@/lib/site";

const description = `The terms that govern your use of the ${site.name} website and our software development services.`;

export const metadata: Metadata = {
  title: "Terms of Service",
  description,
  alternates: { canonical: "/terms" },
  openGraph: { url: "/terms", title: `Terms of Service · ${site.name}`, description },
};

const mail = <a href={`mailto:${site.email}`}>{site.email}</a>;

const sections: LegalSection[] = [
  {
    id: "acceptance",
    title: "Acceptance of these terms",
    body: (
      <>
        <p>
          These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the {site.name} website (the
          &ldquo;Site&rdquo;). By using the Site, you agree to these Terms. If you do not agree, please do not use
          the Site.
        </p>
        <p>
          If you use the Site on behalf of a company or other organisation, you confirm that you are authorised to
          accept these Terms on its behalf.
        </p>
      </>
    ),
  },
  {
    id: "services",
    title: "Our services",
    body: (
      <p>
        {site.name} provides software design, development, AI, cloud and related services. Information on the Site,
        including descriptions of services, timelines and past work, is for general information only and is not an
        offer. Any engagement is governed by a separate written agreement, such as a statement of work or master
        services agreement, which takes precedence over these Terms where they conflict.
      </p>
    ),
  },
  {
    id: "use-of-site",
    title: "Use of the Site",
    body: (
      <>
        <p>You agree not to:</p>
        <ul>
          <li>use the Site in any way that breaks applicable law or infringes anyone&apos;s rights;</li>
          <li>attempt to gain unauthorised access to the Site, its servers or connected systems;</li>
          <li>interfere with the Site&apos;s operation, including by introducing malware or overloading it;</li>
          <li>scrape or harvest the Site&apos;s content or data by automated means except as permitted by robots.txt;</li>
          <li>submit false information or impersonate any person or organisation.</li>
        </ul>
      </>
    ),
  },
  {
    id: "intellectual-property",
    title: "Intellectual property",
    body: (
      <>
        <p>
          The Site and its content, including text, graphics, logos, illustrations and code, are owned by or
          licensed to {site.name} and protected by intellectual-property laws. You may view and share pages for
          personal or internal business purposes, but you may not copy, modify, distribute or reuse them commercially
          without our written permission.
        </p>
        <p>
          Ownership of work we create for clients is set out in the relevant client agreement. Client names, logos
          and project details shown on the Site belong to their respective owners and are used with permission.
        </p>
      </>
    ),
  },
  {
    id: "submissions",
    title: "Information you send us",
    body: (
      <p>
        When you send us project details, ideas or other materials, you confirm you have the right to share them. We
        treat them confidentially and use them only to evaluate and respond to your enquiry. We are happy to sign a
        non-disclosure agreement before you share anything sensitive. Just ask.
      </p>
    ),
  },
  {
    id: "third-party-links",
    title: "Third-party links",
    body: (
      <p>
        The Site may link to websites or services run by others. We do not control and are not responsible for their
        content, policies or practices, and a link does not mean we endorse them.
      </p>
    ),
  },
  {
    id: "disclaimers",
    title: "Disclaimers",
    body: (
      <p>
        The Site is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;. To the fullest extent permitted by
        law, we make no warranties, express or implied, about the Site, including warranties of accuracy,
        availability, merchantability, fitness for a particular purpose or non-infringement. Warranties for our
        services, if any, are those stated in the client agreement.
      </p>
    ),
  },
  {
    id: "limitation-of-liability",
    title: "Limitation of liability",
    body: (
      <p>
        To the fullest extent permitted by law, {site.name} will not be liable for any indirect, incidental, special,
        consequential or punitive damages, or for any loss of profits, revenue, data or goodwill, arising from your
        use of or inability to use the Site. Nothing in these Terms limits liability that cannot be limited by law.
      </p>
    ),
  },
  {
    id: "indemnity",
    title: "Indemnity",
    body: (
      <p>
        You agree to indemnify and hold {site.name} harmless from claims, losses and expenses (including reasonable
        legal fees) arising from your misuse of the Site or your breach of these Terms.
      </p>
    ),
  },
  {
    id: "privacy",
    title: "Privacy",
    body: (
      <p>
        Our <Link href="/privacy">Privacy Policy</Link> explains how we collect and use personal information. By
        using the Site, you acknowledge that we handle your information as described there.
      </p>
    ),
  },
  {
    id: "governing-law",
    title: "Governing law",
    body: (
      <p>
        These Terms are governed by the laws of the jurisdiction in which {site.name} is registered, without regard
        to conflict-of-law rules. Any dispute will be resolved in the courts of that jurisdiction, unless the law of
        your country of residence gives you the right to bring proceedings locally.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to these terms",
    body: (
      <p>
        We may update these Terms from time to time. The &ldquo;Last updated&rdquo; date at the top shows when they
        last changed. Continuing to use the Site after a change means you accept the updated Terms.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact us",
    body: <p>Questions about these Terms? Email us at {mail}.</p>,
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Service"
      lede={`The ground rules for using the ${site.name} website. Client projects are covered by their own written agreement.`}
      updated="2026-10-30"
      sections={sections}
    />
  );
}
