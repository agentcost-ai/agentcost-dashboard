"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, AlertCircle, Loader2, Check, ArrowLeft } from "lucide-react";
import { parseApiError } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/auth/password/reset-request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        },
      );

      // 204 No Content means success, don't try to parse empty body
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to send reset email");
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
          Check your email
        </h1>
        <p className="text-gray-400 mb-8 leading-relaxed wrap-break-word">
          If an account exists for <span className="text-white">{email}</span>,
          we&apos;ve sent a password reset link. Please check your inbox.
        </p>
        <Link
          href="/auth/login"
          className="inline-flex items-center justify-center bg-white hover:bg-gray-100 text-slate-900 font-medium py-3 px-8 rounded-xl transition-colors shadow-lg shadow-white/10"
        >
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-white mb-2">
          Forgot your password?
        </h1>
        <p className="text-gray-400 text-sm">
          Enter your email address and we&apos;ll send you a link to reset your
          password.
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
        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0a0a0b] border border-gray-700/80 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-colors"
              placeholder="you@example.com"
              required
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-white hover:bg-gray-100 disabled:bg-white/40 disabled:cursor-not-allowed text-slate-900 font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-white/10"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Sending...
            </>
          ) : (
            "Send Reset Link"
          )}
        </button>
      </form>

      {/* Back to Login */}
      <div className="mt-8">
        <Link
          href="/auth/login"
          className="flex items-center justify-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>
      </div>
    </div>
  );
}
