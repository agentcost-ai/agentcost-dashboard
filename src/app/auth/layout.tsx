"use client";

import Link from "next/link";
import { Grid2x2Plus } from "lucide-react";
import { FloatingPaths } from "@/components/auth/AuthComponents";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <main className="relative min-h-screen md:h-screen md:overflow-hidden lg:grid lg:grid-cols-2">
            {/* Left Panel - Branding & Testimonial */}
            <div className="bg-[#0d0d0f] relative hidden h-full flex-col border-r border-gray-800/50 p-10 lg:flex">
                <div className="from-background absolute inset-0 z-10 bg-linear-to-t to-transparent" />

                {/* Logo */}
                <Link href="/" className="z-10 flex items-center gap-2">
                    <Grid2x2Plus className="size-6" />
                    <p className="text-xl font-semibold">AgentCost</p>
                </Link>

                {/* Testimonial */}
                <div className="z-10 mt-auto">
                    <blockquote className="space-y-2">
                        <p className="text-xl">
                            &ldquo;This platform has helped me track AI costs effectively and
                            optimize my spending. A must-have for any AI-powered
                            business.&rdquo;
                        </p>
                        <footer className="font-mono text-sm font-semibold">
                            ~ Kushagra
                        </footer>
                    </blockquote>
                </div>

                {/* Animated Background - persists across page transitions */}
                <div className="absolute inset-0">
                    <FloatingPaths position={1} />
                    <FloatingPaths position={-1} />
                </div>
            </div>

            {/* Right Panel - Form Content */}
            <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#0a0a0b] overflow-y-auto">
                {/* Subtle gradient background */}
                <div
                    aria-hidden
                    className="absolute inset-0 isolate contain-strict -z-10 opacity-60"
                >
                    <div className="bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,rgba(255,255,255,0.04)_0,hsla(0,0%,55%,.02)_50%,transparent_80%)] absolute top-0 right-0 h-96 w-96 -translate-y-1/4 rounded-full" />
                </div>

                {children}

                {/* Footer Links */}
                <div className="py-6 w-full">
                    <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
                        <Link
                            href="/terms"
                            className="hover:text-gray-400 transition-colors"
                        >
                            Terms
                        </Link>
                        <span className="w-1 h-1 rounded-full bg-gray-700" />
                        <Link
                            href="/privacy"
                            className="hover:text-gray-400 transition-colors"
                        >
                            Privacy
                        </Link>
                        <span className="w-1 h-1 rounded-full bg-gray-700" />
                        <Link
                            href="/docs/api"
                            className="hover:text-gray-400 transition-colors"
                        >
                            Docs
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}
