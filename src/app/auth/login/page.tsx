"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { parseApiError } from "@/lib/utils";
import { api } from "@/lib/api";
import { Checkbox } from "@/components/auth/AuthComponents";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement,
            config: {
              type?: string;
              theme?: string;
              size?: string;
              text?: string;
              shape?: string;
              width?: number;
            },
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

function LoginContent() {
  const { login, googleLogin } = useAuth();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchParams.get("verified") === "true") {
      setSuccessMessage("Email verified successfully. You can now sign in.");
    }
    if (searchParams.get("password_reset") === "true") {
      setSuccessMessage(
        "Password reset successfully. You can now sign in with your new password.",
      );
    }
  }, [searchParams]);

  const handleGoogleCallback = useCallback(
    async (response: { credential: string }) => {
      setError(null);
      setSuccessMessage(null);
      setIsGoogleLoading(true);
      try {
        await googleLogin(response.credential);
      } catch (err) {
        setError(parseApiError(err));
      } finally {
        setIsGoogleLoading(false);
      }
    },
    [googleLogin],
  );

  // Initialize Google Identity Services
  useEffect(() => {
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!googleClientId) return;

    const initGoogle = () => {
      if (!window.google || !googleButtonRef.current) return;

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCallback,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: "standard",
        theme: "filled_black",
        size: "large",
        text: "continue_with",
        shape: "pill",
      });
    };

    // If the script is already loaded
    if (window.google) {
      initGoogle();
      return;
    }

    // Wait for the script to load
    const interval = setInterval(() => {
      if (window.google) {
        clearInterval(interval);
        initGoogle();
      }
    }, 100);

    const timeout = setTimeout(() => clearInterval(interval), 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [handleGoogleCallback]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setResendSuccess(false);
    setIsLoading(true);

    try {
      await login(email, password, rememberMe);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email || isResending) return;
    setIsResending(true);
    setResendSuccess(false);
    try {
      await api.resendVerification(email);
      setResendSuccess(true);
    } catch {
      setError("Failed to resend verification email. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const isEmailNotVerified = error?.toLowerCase().includes("verify your email");

  return (
    <div className="w-full max-w-100 px-6 py-16">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-[1.75rem] font-semibold tracking-tight text-white mb-2">
          Welcome back
        </h1>
        <p className="text-neutral-500 text-[15px]">
          Sign in to your AgentCost account
        </p>
      </div>

      {/* Google Sign In */}
      <div className="relative w-full">
        {/* Custom styled button (visual only, clicks pass through to Google overlay) */}
        <div
          className={`w-full flex items-center justify-center gap-3 bg-white/2 border border-white/8 text-neutral-300 font-medium py-3 rounded-xl select-none pointer-events-none ${
            !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? "opacity-50" : ""
          }`}
        >
          {isGoogleLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              Signing in with Google...
            </>
          ) : (
            <>
              <svg
                className="w-4.5 h-4.5"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </>
          )}
        </div>
        {/* Invisible Google button overlay — always mounted so ref is stable */}
        <div
          ref={googleButtonRef}
          className={`absolute inset-0 overflow-hidden [&>div]:w-full [&>div]:h-full ${
            isGoogleLoading ? "pointer-events-none opacity-0" : "opacity-0"
          }`}
          aria-hidden="true"
        />
      </div>

      {/* Divider */}
      <div role="separator" className="my-7 flex items-center gap-4">
        <div className="flex-1 h-px bg-white/6" />
        <span
          aria-hidden="true"
          className="text-xs font-mono text-neutral-600 uppercase tracking-wider"
        >
          or
        </span>
        <div className="flex-1 h-px bg-white/6" />
      </div>

      {/* Success Message */}
      {successMessage && (
        <div
          role="status"
          className="mb-6 p-4 bg-emerald-500/8 border border-emerald-500/15 rounded-xl flex items-start gap-3"
        >
          <CheckCircle className="w-4.5 h-4.5 text-emerald-400 shrink-0 mt-0.5" />
          <span className="text-sm text-emerald-300/90 leading-relaxed">
            {successMessage}
          </span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          role="alert"
          className="mb-6 p-4 bg-red-500/8 border border-red-500/15 rounded-xl flex items-start gap-3"
        >
          <AlertCircle className="w-4.5 h-4.5 text-red-400 shrink-0 mt-0.5" />
          <div className="text-sm leading-relaxed">
            <span className="text-red-300/90">{error}</span>
            {isEmailNotVerified && !resendSuccess && (
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={isResending || !email}
                className="mt-2 block text-white/80 hover:text-white underline underline-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResending ? "Sending..." : "Resend verification email"}
              </button>
            )}
            {isEmailNotVerified && resendSuccess && (
              <p className="mt-2 text-emerald-400">
                Verification email sent. Please check your inbox.
              </p>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-[13px] font-medium text-neutral-400 mb-2"
          >
            Email address
          </label>
          <div className="relative group">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-600 group-focus-within:text-neutral-400 transition-colors" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/2 border border-white/8 rounded-xl pl-11 pr-4 py-3 text-[15px] text-white placeholder-neutral-600 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10 transition-all duration-200"
              placeholder="you@company.com"
              required
              autoComplete="email"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="password"
              className="block text-[13px] font-medium text-neutral-400"
            >
              Password
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-[13px] text-neutral-500 hover:text-white transition-colors duration-200"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative group">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-600 group-focus-within:text-neutral-400 transition-colors" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/2 border border-white/8 rounded-xl pl-11 pr-12 py-3 text-[15px] text-white placeholder-neutral-600 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10 transition-all duration-200"
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-400 transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-4.5 h-4.5" />
              ) : (
                <Eye className="w-4.5 h-4.5" />
              )}
            </button>
          </div>
        </div>

        {/* Remember Me */}
        <label className="flex items-center gap-3 cursor-pointer group">
          <Checkbox
            id="rememberMe"
            checked={rememberMe}
            onChange={setRememberMe}
          />
          <span className="text-[13px] text-neutral-500 group-hover:text-neutral-300 transition-colors">
            Remember me for 30 days
          </span>
        </label>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="group w-full bg-white hover:bg-neutral-100 disabled:bg-white/30 disabled:cursor-not-allowed text-[#0a0a0b] font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_1px_20px_rgba(255,255,255,0.06)]"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign in
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>

      {/* Register Link */}
      <p className="text-center text-neutral-500 mt-10 text-[14px]">
        Don&apos;t have an account?{" "}
        <Link
          href="/auth/register"
          className="text-white hover:text-neutral-300 font-medium transition-colors"
        >
          Create account
        </Link>
      </p>

      {/* Demo Link */}
      <p className="text-center text-neutral-600 mt-3 text-[13px]">
        Just exploring?{" "}
        <Link
          href="/demo?src=login"
          className="text-sky-400 hover:text-sky-300 font-medium transition-colors"
        >
          Try the live demo
        </Link>{" "}
        — no account needed.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-neutral-500 animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
