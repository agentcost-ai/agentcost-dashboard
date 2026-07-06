"use client";

import { motion } from "framer-motion";

/**
 * "Continue with GitHub" button — starts the OAuth web flow.
 *
 * Generates a one-time state token (CSRF protection), remembers whether the
 * flow started from login or register (for funnel analytics on the callback
 * page), and redirects to GitHub. GitHub redirects back to
 * /auth/github/callback, which exchanges the code via the backend.
 */
export function GitHubSignInButton({
  label,
  from,
}: {
  label: string;
  from: "login" | "register";
}) {
  const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;

  const startOAuth = () => {
    if (!clientId) return;
    const state = crypto.randomUUID();
    sessionStorage.setItem("github_oauth_state", state);
    sessionStorage.setItem("github_oauth_from", from);
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${window.location.origin}/auth/github/callback`,
      scope: "user:email",
      state,
    });
    window.location.assign(
      `https://github.com/login/oauth/authorize?${params.toString()}`,
    );
  };

  return (
    <button
      type="button"
      onClick={startOAuth}
      disabled={!clientId}
      className={`w-full flex items-center justify-center gap-3 bg-white/2 border border-white/8 hover:border-white/15 text-neutral-300 hover:text-white font-medium py-3 rounded-xl transition-all duration-200 ${
        !clientId ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      }`}
    >
      <svg
        className="w-4.5 h-4.5"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
      </svg>
      {label}
    </button>
  );
}

// Animated floating paths background - shared across auth pages
export function FloatingPaths({ position }: { position: number }) {
  const paths = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
      380 - i * 5 * position
    } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
      152 - i * 5 * position
    } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
      684 - i * 5 * position
    } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    width: 0.5 + i * 0.03,
  }));

  return (
    <div className="pointer-events-none absolute inset-0">
      <svg
        className="h-full w-full text-slate-950 dark:text-white"
        viewBox="0 0 696 316"
        fill="none"
      >
        <title>Background Paths</title>
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={0.1 + path.id * 0.03}
            initial={{ pathLength: 0.3, opacity: 0.6 }}
            animate={{
              pathLength: 1,
              opacity: [0.3, 0.6, 0.3],
              pathOffset: [0, 1, 0],
            }}
            transition={{
              duration: 20 + Math.random() * 10,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />
        ))}
      </svg>
    </div>
  );
}

// Professional checkbox component
export function Checkbox({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id: string;
}) {
  return (
    <div className="relative">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <div
        onClick={() => onChange(!checked)}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 cursor-pointer ${
          checked
            ? "bg-white border-white"
            : "border-gray-600 hover:border-gray-500 bg-transparent"
        }`}
      >
        {checked && (
          <motion.svg
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-3 h-3 text-slate-900"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </motion.svg>
        )}
      </div>
    </div>
  );
}
