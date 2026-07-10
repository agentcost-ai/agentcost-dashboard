"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { parseApiError } from "@/lib/utils";
import { track } from "@/lib/analytics";

/**
 * GitHub OAuth callback — GitHub redirects here with ?code&state after the
 * user authorizes. Validates state (CSRF), exchanges the code through the
 * backend, and githubLogin() handles tokens + redirect to the dashboard.
 */
function GitHubCallback() {
  const searchParams = useSearchParams();
  const { githubLogin } = useAuth();
  const [error, setError] = useState<string | null>(null);
  // OAuth codes are single-use; a strict-mode double effect run or fast
  // re-render must not exchange twice.
  const exchanged = useRef(false);

  useEffect(() => {
    if (exchanged.current) return;

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const expectedState = sessionStorage.getItem("github_oauth_state");
    const from = sessionStorage.getItem("github_oauth_from");

    if (searchParams.get("error")) {
      // User cancelled on GitHub's side
      setError("GitHub sign-in was cancelled.");
      return;
    }

    if (!code || !state || !expectedState || state !== expectedState) {
      setError("Sign-in session expired or invalid. Please try again.");
      return;
    }

    exchanged.current = true;
    sessionStorage.removeItem("github_oauth_state");
    sessionStorage.removeItem("github_oauth_from");

    githubLogin(code)
      .then(() => {
        if (from === "register") {
          track("signup_completed", { method: "github" });
        }
      })
      .catch((err) => {
        setError(parseApiError(err));
      });
  }, [searchParams, githubLogin]);

  if (error) {
    return (
      <div className="w-full max-w-100 px-6 py-16 text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-8 ring-1 ring-red-500/20">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="text-[1.75rem] font-semibold tracking-tight text-white mb-3">
          Sign-in failed
        </h1>
        <p className="text-neutral-500 text-[15px] mb-10 leading-relaxed max-w-xs mx-auto wrap-break-word">
          {error}
        </p>
        <Link
          href="/auth/login"
          className="inline-flex items-center justify-center gap-2 bg-white hover:bg-neutral-100 text-[#0a0a0b] font-semibold py-3 px-8 rounded-xl transition-all duration-200"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-100 px-6 py-16 flex flex-col items-center gap-4">
      <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
      <p className="text-neutral-400 text-sm">Signing you in with GitHub…</p>
    </div>
  );
}

export default function GitHubCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-100 px-6 py-16 flex justify-center">
          <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
        </div>
      }
    >
      <GitHubCallback />
    </Suspense>
  );
}
