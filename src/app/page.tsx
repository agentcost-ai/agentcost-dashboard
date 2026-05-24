"use client";

import { useAuth } from "@/contexts/AuthContext";
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

export default function LandingPage() {
    const { isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0b] text-neutral-100 overflow-x-hidden">
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
