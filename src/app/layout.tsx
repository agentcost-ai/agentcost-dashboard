import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Sora, Caveat } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { BackendPrewarm } from "@/components/BackendPrewarm";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Used only for hand-drawn feature annotations (our signature flourish).
const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "AgentCost — Track OpenAI, Anthropic & LangChain Costs",
  description:
    "Track OpenAI, Anthropic, and LangChain costs in real-time. At AgentCost, see which agents are expensive, set budget guardrails, and get optimization suggestions.",
  keywords: [
    "langchain",
    "openai",
    "anthropic",
    "ai cost tracking",
    "llm costs",
    "agent monitoring",
    "openai pricing",
  ],
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    type: "website",
    url: "https://agentcost.tech/",
    title: "AgentCost - Cost Tracking for OpenAI, Anthropic, and LangChain",
    description:
      "Track OpenAI, Anthropic, and LangChain costs in real-time. Free & open source.",
    images: [
      {
        url: "https://agentcost.tech/icon.svg",
        alt: "AgentCost - LLM Cost Tracking Platform",
      },
    ],
    siteName: "AgentCost",
  },
  twitter: {
    card: "summary_large_image",
    title: "AgentCost - Cost Tracking for OpenAI, Anthropic, and LangChain",
    description: "Track OpenAI, Anthropic, and LangChain costs in real-time.",
    images: ["https://agentcost.tech/icon.svg"],
  },
  // NOTE: do NOT set a fixed `alternates.canonical` here — it leaks to every
  // page that doesn't override it, making them look like duplicates of the
  // homepage (Bing: "alternate version of a canonical page" → not indexed).
  // Each page sets its own canonical; the homepage's lives in app/page.tsx.
  metadataBase: new URL("https://agentcost.tech"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          src="https://accounts.google.com/gsi/client"
          async
          defer
        ></script>
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} ${sora.variable} ${caveat.variable} antialiased bg-neutral-950 text-neutral-100`}
        suppressHydrationWarning={true}
      >
        {/* Site-wide structured data for search engines */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": "https://agentcost.tech/#organization",
                  name: "AgentCost",
                  alternateName: ["Agent Cost", "AgentCost.tech"],
                  url: "https://agentcost.tech",
                  logo: "https://agentcost.tech/icon.svg",
                  slogan: "Real-time LLM cost observability",
                  description:
                    "AgentCost is an open-source LLM cost observability platform. Track, analyze, and optimize OpenAI, Anthropic, and LangChain spending in real time across 2,900+ models.",
                  sameAs: ["https://github.com/agentcost-ai"],
                  founder: { "@id": "https://agentcost.tech/#founder" },
                },
                {
                  "@type": "Person",
                  "@id": "https://agentcost.tech/#founder",
                  name: "Kushagra Agrawal",
                  url: "https://www.linkedin.com/in/kushagra--agrawal/",
                  sameAs: [
                    "https://www.linkedin.com/in/kushagra--agrawal/",
                    "https://x.com/KushagraA15",
                    "https://github.com/DS-Kushagra",
                  ],
                },
                {
                  "@type": "WebSite",
                  "@id": "https://agentcost.tech/#website",
                  url: "https://agentcost.tech",
                  name: "AgentCost",
                  publisher: { "@id": "https://agentcost.tech/#organization" },
                },
                {
                  "@type": "SoftwareApplication",
                  name: "AgentCost",
                  applicationCategory: "DeveloperApplication",
                  operatingSystem: "Any",
                  description:
                    "Real-time LLM cost tracking and optimization for OpenAI, Anthropic, and LangChain across 2,900+ models.",
                  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
                },
              ],
            }),
          }}
        />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-KMLSX540HL"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-KMLSX540HL');
          `}
        </Script>
        <AuthProvider>
          <BackendPrewarm />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
