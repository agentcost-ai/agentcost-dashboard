import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { TrustedBySection } from "@/components/landing/TrustedBySection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { ArchitectureSection } from "@/components/landing/ArchitectureSection";
import { IntegrationSection } from "@/components/landing/IntegrationSection";
import { MetricsSection } from "@/components/landing/MetricsSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "AgentCost — Track OpenAI, Anthropic & LangChain Costs",
  alternates: { canonical: "/" },
};

// Server component so the full marketing page (headline, H1, copy) is in the
// server-rendered HTML for crawlers. The sections are client components and
// render fine underneath. Do NOT gate this behind an auth/loading spinner —
// that would ship an empty page to search engines.
export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0a0a0b] text-neutral-100">
      <Navbar />
      <HeroSection />
      <TrustedBySection />
      <FeaturesSection />
      <ArchitectureSection />
      <IntegrationSection />
      <MetricsSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
}
