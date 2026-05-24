import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Sora } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

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

export const metadata: Metadata = {
  title: "AgentCost - Real-time Cost Tracking for OpenAI, Anthropic, and LangChain",
  description:
    "Track OpenAI, Anthropic, and LangChain costs in real-time. See which agents are expensive, set budget guardrails, and get optimization suggestions.",
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
  alternates: {
    canonical: "https://agentcost.tech/",
  },
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
        className={`${inter.variable} ${jetbrainsMono.variable} ${sora.variable} antialiased bg-neutral-950 text-neutral-100`}
        suppressHydrationWarning={true}
      >
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
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
