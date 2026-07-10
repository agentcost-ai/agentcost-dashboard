"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link. No token provided.");
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/auth/verify-email`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ token }),
          },
        );

        if (response.ok) {
          setStatus("success");
          setMessage("Your email has been verified successfully.");

          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push("/auth/login?verified=true");
          }, 3000);
        } else {
          const data = await response.json();
          setStatus("error");
          setMessage(
            data.detail || "Verification failed. The link may have expired.",
          );
        }
      } catch {
        setStatus("error");
        setMessage("Something went wrong. Please try again later.");
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="w-full max-w-sm px-4 py-8 text-center">
      {status === "loading" && (
        <>
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-white/20">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <h1 className="text-2xl font-semibold text-white mb-2">
            Verifying your email
          </h1>
          <p className="text-gray-400">
            Please wait while we verify your email address...
          </p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-green-500/20">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-semibold text-white mb-2">
            Email Verified
          </h1>
          <p className="text-gray-400 mb-6 wrap-break-word">{message}</p>
          <p className="text-gray-500 text-sm mb-6">
            Redirecting you to login...
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center bg-white hover:bg-gray-100 text-slate-900 font-medium py-3 px-8 rounded-xl transition-colors shadow-lg shadow-white/10"
          >
            Continue to Login
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-red-500/20">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-semibold text-white mb-2">
            Verification Failed
          </h1>
          <p className="text-gray-400 mb-6 wrap-break-word">{message}</p>
          <div className="space-y-3">
            <Link
              href="/auth/login"
              className="block w-full bg-white hover:bg-gray-100 text-slate-900 font-medium py-3 px-6 rounded-xl transition-colors shadow-lg shadow-white/10"
            >
              Go to Login
            </Link>
            <Link
              href="/auth/register"
              className="block w-full bg-transparent border border-gray-700 hover:border-gray-600 text-gray-300 font-medium py-3 px-6 rounded-xl transition-colors"
            >
              Create New Account
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
