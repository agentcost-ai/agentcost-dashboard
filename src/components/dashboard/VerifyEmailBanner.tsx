"use client";

import { useState } from "react";
import { MailWarning, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

const DISMISS_KEY = "agentcost_verify_banner_dismissed";

/**
 * Slim dismissible reminder shown across all dashboard pages while the
 * signed-in user's email is unverified. Replaces the old hard verification
 * gate: users can use the product immediately and verify when convenient.
 *
 * Mounted once in the dashboard layout. Dismissal is session-scoped.
 */
export function VerifyEmailBanner() {
  const { user, token } = useAuth();
  // Lazy init keeps sessionStorage out of SSR; the banner only ever renders
  // client-side anyway (the auth user resolves after hydration).
  const [dismissed, setDismissed] = useState(
    () =>
      typeof window !== "undefined" &&
      sessionStorage.getItem(DISMISS_KEY) === "true",
  );
  const [resendState, setResendState] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");

  // Real session only (the demo's synthetic user has no token) and only while
  // the backend explicitly reports the email as unverified.
  if (!user || !token || user.email_verified !== false || dismissed) {
    return null;
  }

  const handleResend = async () => {
    if (resendState === "sending") return;
    setResendState("sending");
    try {
      await api.resendVerification(user.email);
      setResendState("sent");
    } catch {
      setResendState("error");
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "true");
    setDismissed(true);
  };

  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-amber-700/40 bg-amber-950/30 px-4 py-2.5 print:hidden">
      <MailWarning size={16} className="shrink-0 text-amber-400" />
      <p className="min-w-0 flex-1 text-[13px] text-amber-200/90">
        Verify your email — we sent a link to{" "}
        <span className="font-medium text-white break-all">{user.email}</span>.
      </p>
      <div className="flex items-center gap-2">
        {resendState === "sent" ? (
          <span className="text-[13px] text-emerald-400">Sent — check your inbox</span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resendState === "sending"}
            className="rounded-md border border-amber-600/40 px-2.5 py-1 text-[13px] font-medium text-amber-300 hover:bg-amber-900/40 hover:text-amber-100 transition-colors disabled:opacity-50"
          >
            {resendState === "sending" ? "Sending..." : "Resend"}
          </button>
        )}
        {resendState === "error" && (
          <span className="text-[12px] text-red-400">Failed — try again</span>
        )}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="p-1 text-amber-400/70 hover:text-white transition-colors"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
