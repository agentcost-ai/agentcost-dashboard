"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { isDemoMode, exitDemoMode } from "@/lib/demo/demo";

interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  email_verified: boolean;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
}

// Synthetic user for demo mode — no token, no backend session.
const DEMO_USER: User = {
  id: "demo-user",
  email: "demo@agentcost.dev",
  name: "Demo Explorer",
  avatar_url: null,
  email_verified: true,
  is_active: true,
  created_at: new Date(0).toISOString(),
  last_login_at: null,
};

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isDemo: boolean;
  login: (
    email: string,
    password: string,
    rememberMe?: boolean,
  ) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Routes that don't require authentication
const publicRoutes = [
  "/", // Landing page is public
  "/demo", // Demo entry point — sets demo mode then redirects to dashboard
  "/pricing", // Pricing page is public
  "/blog", // Blog is public
  "/changelog", // Changelog is public
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
  "/auth/accept-policies",
  "/docs", // Documentation is public
  "/terms", // Legal pages are public
  "/privacy",
];

// Routes that authenticated users should be redirected away from (auth pages only)
const authOnlyRoutes = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshTokenValue, setRefreshTokenValue] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = () => {
      try {
        // Demo mode: synthetic user, no tokens. Real auth wins if present.
        if (isDemoMode() && !localStorage.getItem("access_token")) {
          setUser(DEMO_USER);
          return;
        }

        const storedToken = localStorage.getItem("access_token");
        const storedRefreshToken = localStorage.getItem("refresh_token");
        const storedUser = localStorage.getItem("user");

        if (storedToken && storedUser) {
          setToken(storedToken);
          setRefreshTokenValue(storedRefreshToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Listen for token refresh events from API client
  useEffect(() => {
    const handleTokensRefreshed = (event: CustomEvent) => {
      const { access_token, refresh_token } = event.detail;
      setToken(access_token);
      if (refresh_token) {
        setRefreshTokenValue(refresh_token);
      }
    };

    window.addEventListener(
      "tokens-refreshed",
      handleTokensRefreshed as EventListener,
    );
    return () =>
      window.removeEventListener(
        "tokens-refreshed",
        handleTokensRefreshed as EventListener,
      );
  }, []);

  // Redirect logic based on auth state
  useEffect(() => {
    if (isLoading) return;

    const isPublicRoute =
      pathname === "/" ||
      publicRoutes.some(
        (route) => route !== "/" && pathname?.startsWith(route),
      );

    const isAuthRoute = authOnlyRoutes.some((route) =>
      pathname?.startsWith(route),
    );

    // The demo user is synthetic — they must be able to reach the register/
    // login pages (that's the whole conversion path out of the demo).
    const isDemoUser = !!user && !token && user.id === "demo-user";

    if (!user && !isPublicRoute) {
      // Not authenticated and trying to access protected route
      router.push("/auth/login");
    } else if (user && isAuthRoute && !isDemoUser) {
      // Authenticated and trying to access auth pages — go to dashboard
      router.push("/dashboard");
    }
  }, [user, token, isLoading, pathname, router]);

  const login = useCallback(
    async (email: string, password: string, rememberMe = false) => {
      const response = await fetch(`${API_URL}/v1/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          remember_me: rememberMe,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Login failed");
      }

      // A real login supersedes any demo session.
      exitDemoMode(false);

      localStorage.setItem("access_token", data.access_token);
      if (data.refresh_token) {
        localStorage.setItem("refresh_token", data.refresh_token);
        setRefreshTokenValue(data.refresh_token);
      }
      localStorage.setItem("user", JSON.stringify(data.user));

      setToken(data.access_token);
      setUser(data.user);

      // Check if user needs to accept updated policies
      try {
        const policyResponse = await fetch(
          `${API_URL}/v1/auth/policies/status`,
          {
            headers: {
              Authorization: `Bearer ${data.access_token}`,
            },
          },
        );

        if (policyResponse.ok) {
          const policyData = await policyResponse.json();
          if (!policyData.policies_accepted) {
            // User needs to accept updated policies
            router.push("/auth/accept-policies?return=/dashboard");
            return;
          }
        }
      } catch (policyError) {
        // If policy check fails, continue to dashboard
        console.error("Policy check failed:", policyError);
      }

      router.push("/dashboard");
    },
    [API_URL, router],
  );

  const googleLogin = useCallback(
    async (credential: string) => {
      const response = await fetch(`${API_URL}/v1/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          credential,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Google sign-in failed");
      }

      // A real login supersedes any demo session.
      exitDemoMode(false);

      localStorage.setItem("access_token", data.access_token);
      if (data.refresh_token) {
        localStorage.setItem("refresh_token", data.refresh_token);
        setRefreshTokenValue(data.refresh_token);
      }
      localStorage.setItem("user", JSON.stringify(data.user));

      setToken(data.access_token);
      setUser(data.user);

      // Check if user needs to accept updated policies
      try {
        const policyResponse = await fetch(
          `${API_URL}/v1/auth/policies/status`,
          {
            headers: {
              Authorization: `Bearer ${data.access_token}`,
            },
          },
        );

        if (policyResponse.ok) {
          const policyData = await policyResponse.json();
          if (!policyData.policies_accepted) {
            router.push("/auth/accept-policies?return=/dashboard");
            return;
          }
        }
      } catch (policyError) {
        console.error("Policy check failed:", policyError);
      }

      router.push("/dashboard");
    },
    [API_URL, router],
  );

  const register = useCallback(
    async (email: string, password: string, name?: string) => {
      const response = await fetch(`${API_URL}/v1/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Registration failed");
      }

      // Registration successful - user needs to verify email
      // Don't auto-login
    },
    [API_URL],
  );

  const logout = useCallback(async () => {
    // Demo mode: no backend session to revoke — just leave the demo.
    if (!token && isDemoMode()) {
      exitDemoMode();
      setUser(null);
      router.push("/");
      return;
    }

    try {
      if (token) {
        await fetch(`${API_URL}/v1/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      // Clear project-scoped config so a fresh login on a different account
      // doesn't reuse the previous account's API key and trip 403s on
      // permission-checked endpoints (members, budget, etc.).
      localStorage.removeItem("agentcost_config");
      localStorage.removeItem("agentcost_active_project_id");
      window.dispatchEvent(new Event("agentcost_config_updated"));
      window.dispatchEvent(new Event("agentcost_active_project_changed"));
      setToken(null);
      setRefreshTokenValue(null);
      setUser(null);
      router.push("/");
    }
  }, [API_URL, token, router]);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    if (!refreshTokenValue) return false;

    try {
      const response = await fetch(`${API_URL}/v1/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refresh_token: refreshTokenValue,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("access_token", data.access_token);
        if (data.refresh_token) {
          localStorage.setItem("refresh_token", data.refresh_token);
          setRefreshTokenValue(data.refresh_token);
        }
        setToken(data.access_token);
        return true;
      } else {
        // Refresh token is invalid or expired
        await logout();
        return false;
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
      return false;
    }
  }, [API_URL, refreshTokenValue, logout]);

  const refreshUser = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/v1/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
      } else if (response.status === 401) {
        // Try to refresh the token first
        const refreshed = await refreshToken();
        if (!refreshed) {
          await logout();
        }
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
    }
  }, [API_URL, token, logout, refreshToken]);

  // Listen for token refresh failure events from API client
  useEffect(() => {
    const handleTokenRefreshFailed = () => {
      console.log("Token refresh failed, logging out...");
      logout();
    };

    window.addEventListener("token-refresh-failed", handleTokenRefreshFailed);
    return () =>
      window.removeEventListener(
        "token-refresh-failed",
        handleTokenRefreshFailed,
      );
  }, [logout]);

  // Auto-refresh token before expiry (every 45 minutes)
  useEffect(() => {
    if (!token || !refreshTokenValue) return;

    const refreshInterval = setInterval(
      async () => {
        try {
          const response = await fetch(`${API_URL}/v1/auth/refresh`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              refresh_token: refreshTokenValue,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            localStorage.setItem("access_token", data.access_token);
            if (data.refresh_token) {
              localStorage.setItem("refresh_token", data.refresh_token);
              setRefreshTokenValue(data.refresh_token);
            }
            setToken(data.access_token);
          } else {
            // Refresh rejected (session revoked / user deleted) — log out
            await logout();
          }
        } catch (error) {
          console.error("Auto-refresh failed:", error);
        }
      },
      45 * 60 * 1000,
    ); // Refresh every 45 minutes

    return () => clearInterval(refreshInterval);
  }, [token, refreshTokenValue, API_URL, logout]);

  // Session heartbeat; verify the session is still valid every 5 minutes.
  // If the user was deleted or disabled by an admin, this forces an immediate logout
  useEffect(() => {
    if (!token) return;

    const heartbeat = setInterval(
      async () => {
        try {
          const response = await fetch(`${API_URL}/v1/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.status === 401) {
            const refreshed = await refreshToken();
            if (!refreshed) {
              await logout();
            }
          } else if (response.ok) {
            // Sync user data in case admin changed anything (name, role, etc.)
            const userData = await response.json();
            localStorage.setItem("user", JSON.stringify(userData));
            setUser(userData);
          }
        } catch (error) {
          // Network error, do nothing; retry on next interval
        }
      },
      5 * 60 * 1000,
    ); // Every 5 minutes

    return () => clearInterval(heartbeat);
  }, [token, API_URL, logout, refreshToken]);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user,
    isDemo: !!user && !token && user.id === "demo-user",
    login,
    googleLogin,
    register,
    logout,
    refreshUser,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

// HOC for protecting routes
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { isLoading, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push("/auth/login");
      }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) {
      return (
        <div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    return <Component {...props} />;
  };
}
