import Link from "next/link";
import { ArrowUpIcon, ArrowUpRightIcon } from "lucide-react";
import { LogoMark } from "./logo";
import { Container } from "./section-heading";

const columns = [
  {
    title: "Explore",
    links: [
      { label: "Capabilities", href: "#capabilities" },
      { label: "Process", href: "#process" },
      { label: "Work", href: "#work" },
      { label: "Testimonials", href: "#testimonials" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Journal", href: "#" },
      { label: "Contact", href: "#contact" },
    ],
  },
  {
    title: "Connect",
    links: [
      { label: "LinkedIn", href: "#" },
      { label: "GitHub", href: "#" },
      { label: "X / Twitter", href: "#" },
      { label: "Dribbble", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="px-3 pb-3 sm:px-4 sm:pb-4">
      <div className="relative overflow-hidden rounded-[40px] bg-card">
        <Container className="py-14 sm:py-20">
          <div className="grid gap-14 lg:grid-cols-12">
            {/* Contact */}
            <div className="lg:col-span-5">
              <Link href="/" aria-label="Upforward home" className="flex w-fit items-center gap-2.5">
                <LogoMark className="h-6" />
                <span className="text-[18px] font-semibold tracking-tight">Upforward</span>
              </Link>
              <span className="mt-10 inline-flex items-center gap-2.5 rounded-full bg-black px-4 py-2 text-[14px]">
                <span className="relative flex size-2">
                  <span className="absolute inset-0 animate-ping rounded-full bg-white opacity-60" />
                  <span className="relative size-2 rounded-full bg-white" />
                </span>
                Available for new projects
              </span>
              <h2 className="headline mt-8 text-[36px] sm:text-[48px]">Have a project in mind?</h2>
              <a
                href="mailto:hello@upforward.org"
                className="group mt-6 inline-flex items-center gap-4 text-[22px] font-medium sm:text-[28px]"
              >
                hello@upforward.org
                <span className="flex size-11 items-center justify-center rounded-full bg-white text-black transition-transform duration-500 group-hover:rotate-45">
                  <ArrowUpRightIcon className="size-5" />
                </span>
              </a>
              <p className="mt-4 text-[15px] text-white/50">Replies within one business day.</p>
            </div>

            {/* Links */}
            <nav aria-label="Footer" className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-6 lg:col-start-7">
              {columns.map((col) => (
                <div key={col.title}>
                  <h3 className="text-[14px] text-white/40">{col.title}</h3>
                  <ul className="mt-5 space-y-3">
                    {col.links.map((link) => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          className="group inline-flex items-center gap-1 text-[16px] text-white/80 transition-colors hover:text-white"
                        >
                          {link.label}
                          <ArrowUpRightIcon className="size-3.5 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>

          {/* Legal */}
          <div className="mt-16 flex flex-col gap-6 border-t border-white/10 pt-8 text-[14px] text-white/50 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Upforward. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link href="#" className="transition-colors hover:text-white">Privacy</Link>
              <Link href="#" className="transition-colors hover:text-white">Terms</Link>
              <a
                href="#"
                aria-label="Back to top"
                className="flex size-11 items-center justify-center rounded-full bg-black text-white transition-colors hover:bg-white hover:text-black"
              >
                <ArrowUpIcon className="size-4" />
              </a>
            </div>
          </div>
        </Container>
      </div>
    </footer>
  );
}
