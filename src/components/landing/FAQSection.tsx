"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Minus, ArrowRight } from "lucide-react";
import Link from "next/link";
import { faqs } from "./faq-data";

function FAQItem({ q, a }: { q: string; a: string }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="border-b border-white/4 last:border-0">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between gap-4 sm:gap-6 py-5 text-left group"
            >
                <span
                    className={`text-[15px] transition-colors duration-200 ${open ? "text-white" : "text-neutral-300 group-hover:text-white"
                        }`}
                >
                    {q}
                </span>
                <span className="shrink-0">
                    {open ? (
                        <Minus className="size-4 text-neutral-500" />
                    ) : (
                        <Plus className="size-4 text-neutral-600 group-hover:text-neutral-400 transition-colors" />
                    )}
                </span>
            </button>
            {/* Answer is ALWAYS in the DOM (crawlers index it — it was
                previously mounted only on click and invisible to search
                engines); the reveal is a pure CSS grid-rows collapse. */}
            <div
                className={`grid transition-all duration-300 ease-out ${
                    open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
                aria-hidden={!open}
            >
                <div className="overflow-hidden">
                    <p className="text-[14px] text-neutral-500 leading-relaxed pb-5 pr-6 sm:pr-10">
                        {a}
                    </p>
                </div>
            </div>
        </div>
    );
}

export function FAQSection() {
    return (
      <section id="faq" className="relative py-20 sm:py-32 border-t border-white/3">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          {/* Centered header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-16"
          >
            <p className="text-xs font-mono text-sky-400/80 uppercase tracking-[0.2em] mb-5">
              FAQ
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Frequently asked questions
            </h2>
          </motion.div>

          {/* Categorized accordions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-10"
          >
            {faqs.map((group) => (
              <div key={group.category}>
                <p className="text-xs font-mono text-neutral-600 uppercase tracking-widest mb-4">
                  {group.category}
                </p>
                <div className="rounded-xl border border-white/6 bg-[#0b0b0d]/50 px-4 sm:px-6">
                  {group.questions.map((faq) => (
                    <FAQItem key={faq.q} q={faq.q} a={faq.a} />
                  ))}
                </div>
              </div>
            ))}
          </motion.div>

          {/* Bottom help line */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-12 text-center"
          >
            <p className="text-sm text-neutral-600">
              Have another question?{" "}
              <Link
                href="/docs/sdk"
                className="text-neutral-400 hover:text-white transition-colors"
              >
                Read the docs
              </Link>
              {" · "}
              <a
                href="https://github.com/agentcost-ai/agentcost-sdk/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-white transition-colors"
              >
                Open a GitHub issue
                <ArrowRight className="inline size-3 ml-1" />
              </a>
            </p>
          </motion.div>
        </div>
      </section>
    );
}
