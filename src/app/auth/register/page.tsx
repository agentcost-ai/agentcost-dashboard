"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Check,
  X,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { parseApiError } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Checkbox } from "@/components/auth/AuthComponents";
import { isDemoMode, exitDemoMode, trackDemo } from "@/lib/demo/demo";

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

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  { label: "8+ characters", test: (p) => p.length >= 8 },
  { label: "Uppercase", test: (p) => /[A-Z]/.test(p) },
  { label: "Lowercase", test: (p) => /[a-z]/.test(p) },
  { label: "Number", test: (p) => /[0-9]/.test(p) },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function RegisterPage() {
  const router = useRouter();
  const { googleLogin } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [policyVersions, setPolicyVersions] = useState({
    terms: "1.0",
    privacy: "1.0",
  });

  useEffect(() => {
    const fetchPolicyVersions = async () => {
      try {
        const response = await fetch(`${API_URL}/v1/auth/policies/current`);
        if (response.ok) {
          const data = await response.json();
          setPolicyVersions({
            terms: data.terms_version,
            privacy: data.privacy_version,
          });
        }
      } catch {
        // Backend unreachable — fall back to the built-in defaults silently.
        // This is an expected, fully-handled path (e.g. API not yet up), so
        // it is a warning, not an error that should surface in the overlay.
        console.warn("Policy versions unavailable; using defaults");
      }
    };
    fetchPolicyVersions();
  }, []);

  const handleGoogleCallback = useCallback(
    async (response: { credential: string }) => {
      setError(null);
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
        text: "signup_with",
        shape: "pill",
      });
    };

    if (window.google) {
      initGoogle();
      return;
    }

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

  const allRequirementsMet = passwordRequirements.every((req) =>
    req.test(password),
  );
  const passwordsMatch = password === confirmPassword && password.length > 0;
  const consentGiven = acceptTerms && acceptPrivacy;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!allRequirementsMet) {
      setError("Please meet all password requirements");
      return;
    }

    if (!passwordsMatch) {
      setError("Passwords do not match");
      return;
    }

    if (!consentGiven) {
      setError(
        "You must accept both the Terms of Service and Privacy Policy to create an account",
      );
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/v1/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
            name: name || undefined,
            accept_terms: acceptTerms,
            accept_privacy: acceptPrivacy,
            terms_version: policyVersions.terms,
            privacy_version: policyVersions.privacy,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Registration failed");
      }

      // Attribute the conversion if this visitor came through the demo,
      // then leave demo mode so first login lands on their real workspace.
      if (localStorage.getItem("agentcost_demo_session_id")) {
        trackDemo("signup_completed");
      }
      if (isDemoMode()) {
        exitDemoMode(false);
      }

      setSuccess(true);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-100 px-6 py-16 text-center">
        <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-8 ring-1 ring-emerald-500/20">
          <Check className="w-8 h-8 text-emerald-400" />
        </div>
        <h1 className="text-[1.75rem] font-semibold tracking-tight text-white mb-3">
          Check your email
        </h1>
        <p className="text-neutral-500 text-[15px] mb-10 leading-relaxed max-w-xs mx-auto">
          We&apos;ve sent a verification link to{" "}
          <span className="text-white font-medium">{email}</span>. Click the
          link to activate your account.
        </p>
        <Link
          href="/auth/login"
          className="group inline-flex items-center justify-center gap-2 bg-white hover:bg-neutral-100 text-[#0a0a0b] font-semibold py-3 px-8 rounded-xl transition-all duration-200 shadow-[0_1px_20px_rgba(255,255,255,0.06)]"
        >
          Continue to sign in
          <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
        <p className="mt-8 text-[13px] text-neutral-600">
          Didn&apos;t receive it? Check your spam folder.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-100 px-6 py-16">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-[1.75rem] font-semibold tracking-tight text-white mb-2">
          Create your account
        </h1>
        <p className="text-neutral-500 text-[15px]">
          Start tracking your AI costs in minutes
        </p>
      </div>

      {/* Google Sign Up */}
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
              Signing up with Google...
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
              Sign up with Google
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
      <p className="text-center text-[11px] text-neutral-600 mt-2">
        By signing up with Google, you agree to our{" "}
        <Link
          href="/terms"
          target="_blank"
          className="text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          Terms
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          target="_blank"
          className="text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          Privacy Policy
        </Link>
      </p>

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

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="mb-6 p-4 bg-red-500/8 border border-red-500/15 rounded-xl flex items-start gap-3"
        >
          <AlertCircle className="w-4.5 h-4.5 text-red-400 shrink-0 mt-0.5" />
          <span className="text-sm text-red-300/90 leading-relaxed">
            {error}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div>
          <label
            htmlFor="name"
            className="block text-[13px] font-medium text-neutral-400 mb-2"
          >
            Name{" "}
            <span className="text-neutral-600 font-normal">(optional)</span>
          </label>
          <div className="relative group">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-600 group-focus-within:text-neutral-400 transition-colors" />
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/2 border border-white/8 rounded-xl pl-11 pr-4 py-3 text-[15px] text-white placeholder-neutral-600 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10 transition-all duration-200"
              placeholder="Your name"
            />
          </div>
        </div>

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
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="block text-[13px] font-medium text-neutral-400 mb-2"
          >
            Password
          </label>
          <div className="relative group">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-600 group-focus-within:text-neutral-400 transition-colors" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/2 border border-white/8 rounded-xl pl-11 pr-12 py-3 text-[15px] text-white placeholder-neutral-600 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10 transition-all duration-200"
              placeholder="Create a strong password"
              required
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

          {/* Password Requirements — compact inline */}
          {password.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
              {passwordRequirements.map((req, index) => {
                const met = req.test(password);
                return (
                  <div
                    key={index}
                    className="flex items-center gap-1.5 text-[12px]"
                  >
                    {met ? (
                      <Check
                        className="w-3 h-3 text-emerald-400"
                        aria-hidden="true"
                      />
                    ) : (
                      <X
                        className="w-3 h-3 text-neutral-600"
                        aria-hidden="true"
                      />
                    )}
                    <span
                      className={
                        met ? "text-emerald-400/80" : "text-neutral-600"
                      }
                    >
                      {req.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-[13px] font-medium text-neutral-400 mb-2"
          >
            Confirm password
          </label>
          <div className="relative group">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-600 group-focus-within:text-neutral-400 transition-colors" />
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full bg-white/2 border rounded-xl pl-11 pr-12 py-3 text-[15px] text-white placeholder-neutral-600 focus:outline-none focus:ring-1 transition-all duration-200 ${
                confirmPassword.length > 0
                  ? passwordsMatch
                    ? "border-emerald-500/40 focus:border-emerald-500/60 focus:ring-emerald-500/15"
                    : "border-red-500/40 focus:border-red-500/60 focus:ring-red-500/15"
                  : "border-white/8 focus:border-white/20 focus:ring-white/10"
              }`}
              placeholder="Confirm your password"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={
                showConfirmPassword ? "Hide password" : "Show password"
              }
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-400 transition-colors"
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4.5 h-4.5" />
              ) : (
                <Eye className="w-4.5 h-4.5" />
              )}
            </button>
          </div>
          {confirmPassword.length > 0 && !passwordsMatch && (
            <p className="mt-2 text-[12px] text-red-400/80">
              Passwords do not match
            </p>
          )}
        </div>

        {/* Legal Consent */}
        <div className="space-y-3 pt-1">
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="mt-0.5">
              <Checkbox
                id="acceptTerms"
                checked={acceptTerms}
                onChange={setAcceptTerms}
              />
            </div>
            <span className="text-[13px] text-neutral-400 leading-relaxed">
              I agree to the{" "}
              <Link
                href="/terms"
                target="_blank"
                className="text-neutral-300 hover:text-white inline-flex items-center gap-1 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                Terms of Service
                <ExternalLink className="w-2.5 h-2.5" />
              </Link>
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="mt-0.5">
              <Checkbox
                id="acceptPrivacy"
                checked={acceptPrivacy}
                onChange={setAcceptPrivacy}
              />
            </div>
            <span className="text-[13px] text-neutral-400 leading-relaxed">
              I agree to the{" "}
              <Link
                href="/privacy"
                target="_blank"
                className="text-neutral-300 hover:text-white inline-flex items-center gap-1 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                Privacy Policy
                <ExternalLink className="w-2.5 h-2.5" />
              </Link>
            </span>
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={
            isLoading || !allRequirementsMet || !passwordsMatch || !consentGiven
          }
          className="group w-full bg-white hover:bg-neutral-100 disabled:bg-white/30 disabled:cursor-not-allowed text-[#0a0a0b] font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_1px_20px_rgba(255,255,255,0.06)]"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              Create account
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>

      {/* Login Link */}
      <p className="text-center text-neutral-500 mt-10 text-[14px]">
        Already have an account?{" "}
        <Link
          href="/auth/login"
          className="text-white hover:text-neutral-300 font-medium transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
