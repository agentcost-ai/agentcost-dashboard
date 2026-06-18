"use client";

import { motion } from "framer-motion";

const providers = [
  "OpenAI",
  "Anthropic",
  "Google",
  "Mistral",
  "DeepSeek",
  "Groq",
  "Cohere",
  "Together AI",
  "AWS Bedrock",
  "Azure OpenAI",
  "Perplexity",
  "Replicate",
  "Fireworks AI",
  "Meta Llama",
];

export function TrustedBySection() {
  return (
    <section className="relative py-20 overflow-hidden border-y border-white/4">
      {/* Subtle background accent */}
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-sky-500/1 to-transparent pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 mb-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <p className="text-sm font-medium text-neutral-500 uppercase tracking-widest">
            Supporting <span className="text-neutral-400">2,900+ models</span>{" "}
            across all major providers
          </p>
        </motion.div>
      </div>

      {/* Marquee */}
      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-40 bg-linear-to-r from-[#0a0a0b] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-40 bg-linear-to-l from-[#0a0a0b] to-transparent z-10 pointer-events-none" />

        <div className="flex animate-marquee">
          {[...providers, ...providers].map((name, i) => (
            <div
              key={`${name}-${i}`}
              className="shrink-0 mx-3 px-5 py-2.5 rounded-lg border border-white/5 bg-white/1.5 text-neutral-500 text-sm font-medium whitespace-nowrap hover:border-white/12 hover:text-neutral-300 transition-all duration-300 hover:bg-white/3"
            >
              {name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
