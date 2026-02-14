"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  FileText,
  Lock,
  Check,
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { parseApiError } from "@/lib/utils";
import { Checkbox } from "@/components/auth/AuthComponents";

interface PolicyStatus {
  policy_type: string;
  current_version: string;
  accepted_version: string | null;
  accepted_at: string | null;
  is_current: boolean;
}

interface PolicyCheckResponse {
  policies_accepted: boolean;
  terms: PolicyStatus;
  privacy: PolicyStatus;
}

function AcceptPoliciesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [policyStatus, setPolicyStatus] = useState<PolicyCheckResponse | null>(
    null,
  );
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const returnUrl = searchParams.get("return") || "/";

  // Fetch current policy status
  useEffect(() => {
    const fetchPolicyStatus = async () => {
      if (!token) {
        router.push("/auth/login");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/v1/auth/policies/status`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data: PolicyCheckResponse = await response.json();
          setPolicyStatus(data);

          // If all policies are accepted, redirect
          if (data.policies_accepted) {
            router.push(returnUrl);
          }
        } else if (response.status === 401) {
          router.push("/auth/login");
        }
      } catch (err) {
        setError("Failed to load policy status. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPolicyStatus();
  }, [token, API_URL, router, returnUrl]);

  const needsTermsAcceptance = policyStatus && !policyStatus.terms.is_current;
  const needsPrivacyAcceptance =
    policyStatus && !policyStatus.privacy.is_current;

  const canSubmit =
    (!needsTermsAcceptance || acceptTerms) &&
    (!needsPrivacyAcceptance || acceptPrivacy);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const consents: { policy_type: string; policy_version: string }[] = [];

    if (needsTermsAcceptance && acceptTerms && policyStatus) {
      consents.push({
        policy_type: "terms",
        policy_version: policyStatus.terms.current_version,
      });
    }

    if (needsPrivacyAcceptance && acceptPrivacy && policyStatus) {
      consents.push({
        policy_type: "privacy",
        policy_version: policyStatus.privacy.current_version,
      });
    }

    try {
      const response = await fetch(`${API_URL}/v1/auth/policies/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(consents),
      });

      if (response.ok) {
        const data: PolicyCheckResponse = await response.json();
        if (data.policies_accepted) {
          // Clear the flag and redirect
          localStorage.removeItem("policies_outdated");
          router.push(returnUrl);
        } else {
          setError("Failed to accept all policies. Please try again.");
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to accept policies");
      }
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecline = async () => {
    // User declines - log them out
    await logout();
    router.push("/auth/login");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-white/20">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-semibold text-white mb-3">
          Updated Policies
        </h1>
        <p className="text-gray-400 leading-relaxed">
          We have updated our legal agreements. Please review and accept the
          updated policies to continue using AgentCost.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span className="text-sm leading-relaxed">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Terms of Service */}
        {needsTermsAcceptance && (
          <div className="p-4 bg-amber-900/10 border border-amber-800/30 rounded-xl">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-white mb-1">
                  Terms of Service
                </h3>
                <p className="text-sm text-gray-400 mb-3">
                  Updated to version {policyStatus?.terms.current_version}
                  {policyStatus?.terms.accepted_version && (
                    <span className="text-gray-500">
                      {" "}
                      (you accepted v{policyStatus.terms.accepted_version})
                    </span>
                  )}
                </p>
                <Link
                  href="/terms"
                  target="_blank"
                  className="text-sm text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
                >
                  Read Terms of Service
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
            <label className="flex items-start gap-3 mt-4 cursor-pointer group">
              <div className="mt-0.5">
                <Checkbox
                  id="acceptTerms"
                  checked={acceptTerms}
                  onChange={setAcceptTerms}
                />
              </div>
              <span className="text-sm text-gray-300">
                I have read and agree to the updated Terms of Service
              </span>
            </label>
          </div>
        )}

        {/* Privacy Policy */}
        {needsPrivacyAcceptance && (
          <div className="p-4 bg-amber-900/10 border border-amber-800/30 rounded-xl">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-white mb-1">Privacy Policy</h3>
                <p className="text-sm text-gray-400 mb-3">
                  Updated to version {policyStatus?.privacy.current_version}
                  {policyStatus?.privacy.accepted_version && (
                    <span className="text-gray-500">
                      {" "}
                      (you accepted v{policyStatus.privacy.accepted_version})
                    </span>
                  )}
                </p>
                <Link
                  href="/privacy"
                  target="_blank"
                  className="text-sm text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
                >
                  Read Privacy Policy
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
            <label className="flex items-start gap-3 mt-4 cursor-pointer group">
              <div className="mt-0.5">
                <Checkbox
                  id="acceptPrivacy"
                  checked={acceptPrivacy}
                  onChange={setAcceptPrivacy}
                />
              </div>
              <span className="text-sm text-gray-300">
                I have read and agree to the updated Privacy Policy
              </span>
            </label>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleDecline}
            className="flex-1 py-3 px-4 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 transition-colors font-medium"
          >
            Decline and Logout
          </button>
          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="flex-1 bg-white hover:bg-gray-100 disabled:bg-white/40 disabled:cursor-not-allowed text-slate-900 font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-white/10"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Accepting...
              </>
            ) : (
              "Accept and Continue"
            )}
          </button>
        </div>
      </form>

      {/* Footer */}
      <p className="text-center text-gray-500 text-sm mt-8">
        Questions about these changes?{" "}
        <a
          href="mailto:hello@agentcost.tech"
          className="text-gray-400 hover:text-white transition-colors"
        >
          Contact us
        </a>
      </p>
    </div>
  );
}

export default function AcceptPoliciesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      }
    >
      <AcceptPoliciesContent />
    </Suspense>
  );
}
