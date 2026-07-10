"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Check,
  X,
} from "lucide-react";
import { parseApiError } from "@/lib/utils";

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "One number", test: (p) => /[0-9]/.test(p) },
];

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const allRequirementsMet = passwordRequirements.every((req) =>
    req.test(password),
  );
  const passwordsMatch = password === confirmPassword && password.length > 0;

  // Check if token is present
  useEffect(() => {
    if (!token) {
      setError(
        "Invalid or missing reset token. Please request a new password reset.",
      );
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Invalid or missing reset token");
      return;
    }

    if (!allRequirementsMet) {
      setError("Please meet all password requirements");
      return;
    }

    if (!passwordsMatch) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/auth/password/reset`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            new_password: password,
          }),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to reset password");
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
      <div className="w-full max-w-sm px-4 py-8 text-center">
        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-green-500/20">
          <Check className="w-8 h-8 text-green-500" />
        </div>
        <h1 className="text-2xl font-semibold text-white mb-2">
          Password reset successful
        </h1>
        <p className="text-gray-400 mb-8">
          Your password has been reset. You can now log in with your new
          password.
        </p>
        <Link
          href="/auth/login?password_reset=true"
          className="inline-flex items-center justify-center bg-white hover:bg-gray-100 text-slate-900 font-medium py-3 px-8 rounded-xl transition-colors shadow-lg shadow-white/10"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-white mb-2">
          Reset your password
        </h1>
        <p className="text-gray-400 text-sm">
          Create a new secure password for your account
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span className="text-sm leading-relaxed wrap-break-word min-w-0">
            {error}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* New Password */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            New Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0a0a0b] border border-gray-700/80 rounded-xl pl-11 pr-12 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-colors"
              placeholder="Enter new password"
              required
              disabled={!token}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-0.5 top-1/2 -translate-y-1/2 p-3 text-gray-500 hover:text-gray-400 transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Password Requirements */}
          {password.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {passwordRequirements.map((req, index) => {
                const met = req.test(password);
                return (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    {met ? (
                      <Check className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-gray-500" />
                    )}
                    <span className={met ? "text-green-500" : "text-gray-500"}>
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
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Confirm New Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full bg-[#0a0a0b] border rounded-xl pl-11 pr-12 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-colors ${
                confirmPassword.length > 0
                  ? passwordsMatch
                    ? "border-green-500/50 focus:border-green-500 focus:ring-green-500"
                    : "border-red-500/50 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-700/80 focus:border-gray-500 focus:ring-gray-500"
              }`}
              placeholder="Confirm new password"
              required
              disabled={!token}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={
                showConfirmPassword ? "Hide password" : "Show password"
              }
              className="absolute right-0.5 top-1/2 -translate-y-1/2 p-3 text-gray-500 hover:text-gray-400 transition-colors"
            >
              {showConfirmPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {confirmPassword.length > 0 && !passwordsMatch && (
            <p className="mt-2 text-xs text-red-400">Passwords do not match</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={
            isLoading || !token || !allRequirementsMet || !passwordsMatch
          }
          className="w-full bg-white hover:bg-gray-100 disabled:bg-white/40 disabled:cursor-not-allowed text-slate-900 font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-white/10"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Resetting...
            </>
          ) : (
            "Reset Password"
          )}
        </button>
      </form>

      {/* Back to Login */}
      <div className="mt-8 text-center">
        <Link
          href="/auth/login"
          className="text-gray-400 hover:text-white text-sm transition-colors"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
