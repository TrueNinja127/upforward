"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MenuIcon, XIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { ease } from "./motion";
import { PillLink } from "./pill-button";

const navLinks = [
  { href: "#capabilities", label: "Capabilities" },
  { href: "#process", label: "Process" },
  { href: "#work", label: "Work" },
  { href: "#faq", label: "FAQ" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-500",
        scrolled || open ? "bg-black/80 backdrop-blur-xl backdrop-saturate-150" : "bg-transparent"
      )}
    >
      <div className="mx-auto flex h-20 max-w-[1280px] items-center justify-between px-5 sm:px-8">
        <Logo />

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 text-[15px] text-white/70 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <PillLink href="#contact" className="hidden h-11 text-[15px] font-medium sm:inline-flex">
            Start a project
          </PillLink>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="flex size-11 items-center justify-center rounded-full bg-card md:hidden"
          >
            {open ? <XIcon className="size-5" /> : <MenuIcon className="size-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "100dvh" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.5, ease }}
            className="overflow-hidden bg-black md:hidden"
          >
            <ul className="px-6 pt-8">
              {navLinks.map((link, i) => (
                <motion.li
                  key={link.href}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05, duration: 0.6, ease }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="headline block py-3 text-[40px]"
                  >
                    {link.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
            <div className="px-6 pt-8">
              <PillLink href="#contact" onClick={() => setOpen(false)} className="h-14 w-full">
                Start a project
              </PillLink>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
