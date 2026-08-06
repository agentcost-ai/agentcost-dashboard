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
  // `template` auto-brands every page that sets its own title; pages therefore
  // must NOT hand-write " | AgentCost" in their title strings (double-brand).
  title: {
    default: "AgentCost — Track OpenAI, Anthropic, Gemini & LangChain Costs",
    template: "%s | AgentCost",
  },
  description:
    "Track OpenAI, Anthropic, Gemini, and LangChain costs in real-time. At AgentCost, see which agents are expensive, set budget guardrails, and get optimization suggestions.",
  keywords: [
    "langchain",
    "openai",
    "anthropic",
    "gemini",
    "ai cost tracking",
    "llm costs",
    "agent monitoring",
    "openai pricing",
  ],
  icons: {
    // favicon.ico lives at src/app/favicon.ico (app-router file convention) so
    // browsers hard-requesting /favicon.ico get a real ICO instead of a 404.
    icon: [
      { url: "/favicon.ico", sizes: "48x48 32x32 16x16" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: [{ url: "/favicon.ico" }],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  // Deliberately minimal:
  // - no `url`/`title`/`description` here — they would leak the homepage's
  //   values onto every page that doesn't override openGraph (Next.js metadata
  //   merging is shallow).
  // - no `images` here — config images SUPPRESS the file-based
  //   app/opengraph-image.tsx; with them absent, Next serves that 1200×630 PNG
  //   as both og:image and twitter:image (the old icon.svg broke Twitter cards).
  openGraph: {
    type: "website",
    siteName: "AgentCost",
  },
  twitter: {
    card: "summary_large_image",
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
                    "AgentCost is an open-source LLM cost observability platform with a free hosted cloud. Track, analyze, and optimize OpenAI, Anthropic, Gemini, and LangChain spending in real time across 3,500+ models.",
                  sameAs: [
                    "https://github.com/agentcost-ai",
                    "https://pypi.org/project/agentcost/",
                    "https://dev.to/kushagra125",
                  ],
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
                  url: "https://agentcost.tech",
                  applicationCategory: "DeveloperApplication",
                  operatingSystem: "Any",
                  description:
                    "Real-time LLM cost tracking and optimization for OpenAI, Anthropic, Gemini, and LangChain across 3,500+ models.",
                  downloadUrl: "https://pypi.org/project/agentcost/",
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
        {/* Microsoft Clarity session recordings — only loads when the project
            ID is configured (create one at clarity.microsoft.com). */}
        {process.env.NEXT_PUBLIC_CLARITY_ID && (
          <Script id="microsoft-clarity" strategy="afterInteractive">
            {`
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${process.env.NEXT_PUBLIC_CLARITY_ID}");
            `}
          </Script>
        )}
        <AuthProvider>
          <BackendPrewarm />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
