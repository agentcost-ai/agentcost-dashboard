"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Grid2x2Plus, Menu, X } from "lucide-react";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Live Demo", href: "/demo?src=navbar" },
  { label: "Integration", href: "#integration" },
  { label: "Pricing", href: "/pricing" },
  { label: "Blog", href: "/blog" },
  { label: "Changelog", href: "/changelog" },
  { label: "Docs", href: "/docs/sdk" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[#0a0a0b]/80 backdrop-blur-2xl border-b border-white/6 shadow-xl shadow-black/20"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <Grid2x2Plus className="size-6 text-sky-400 transition-transform duration-500 group-hover:rotate-90" />
              <div className="absolute inset-0 blur-xl bg-sky-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">
              AgentCost
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors duration-200 rounded-lg hover:bg-white/4"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/auth/login"
              className="px-4 py-2 text-sm text-neutral-300 hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/auth/register"
              className="px-5 py-2 text-sm font-medium text-black bg-white hover:bg-neutral-200 rounded-lg transition-all duration-200 shadow-lg shadow-white/6"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-neutral-400 hover:text-white transition-colors"
          >
            {mobileOpen ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden bg-[#0a0a0b]/95 backdrop-blur-2xl border-t border-white/6 overflow-hidden"
          >
            <div className="px-6 py-4 space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 text-sm text-neutral-400 hover:text-white transition-colors rounded-lg hover:bg-white/4"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-4 border-t border-white/6 space-y-2">
                <Link
                  href="/auth/login"
                  className="block px-4 py-3 text-sm text-neutral-300 hover:text-white transition-colors rounded-lg hover:bg-white/4"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/register"
                  className="block px-4 py-3 text-sm font-medium text-center text-black bg-white rounded-lg"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
