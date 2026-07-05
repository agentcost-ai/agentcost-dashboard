"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { enterDemoMode } from "@/lib/demo/demo";
import { prewarmBackend } from "@/lib/prewarm";

/**
 * Demo entry point — the marketable URL (agentcost.dev/demo).
 *
 * Sets demo mode, records the marketing source (?src=hero|navbar|login|...)
 * and hands off to the dashboard with a full navigation so AuthContext
 * re-initializes with the synthetic demo user.
 */
function DemoEntry() {
  const searchParams = useSearchParams();

  useEffect(() => {
    enterDemoMode(searchParams.get("src"));
    // Wake the backend now: the visitor is about to spend minutes exploring
    // the (client-side) demo, which is plenty of runway to cold-start the
    // service so signup later feels instant.
    prewarmBackend(true);
    window.location.replace("/dashboard");
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
      <p className="text-neutral-400 text-sm">
        Preparing your live demo — no signup needed…
      </p>
    </div>
  );
}

export default function DemoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
        </div>
      }
    >
      <DemoEntry />
    </Suspense>
  );
}
