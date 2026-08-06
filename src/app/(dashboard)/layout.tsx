"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Grid2x2Plus } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { DemoExperience } from "@/components/demo/DemoExperience";
import { VerifyEmailBanner } from "@/components/dashboard/VerifyEmailBanner";
import { ActiveProjectProvider } from "@/contexts/ActiveProjectContext";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, isAuthenticated, isDemo } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // AuthProvider handles redirect to login if not authenticated
  // This is a safety check - render nothing while redirecting
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <ActiveProjectProvider>
      <Sidebar
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />

      {/* Drawer overlay (mobile only) */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-neutral-800 bg-neutral-950/80 px-4 backdrop-blur-xl lg:hidden print:hidden">
        <button
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open navigation"
          className="-ml-2 flex h-11 w-11 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-800 hover:text-white"
        >
          <Menu size={20} />
        </button>
        <Link href="/dashboard" className="flex items-center gap-2">
          <Grid2x2Plus className="size-6 text-sky-400" />
          <span className="text-base font-semibold text-white">AgentCost</span>
        </Link>
        <NotificationBell />
      </header>

      <main
        className={`min-h-screen p-4 sm:p-6 lg:p-8 lg:ml-(--sidebar-width,16rem) transition-[margin-left] duration-200 ease-out ${
          // The floating demo banner (fixed, ~100px tall) must never cover
          // page-bottom controls like pagination — reserve space for it.
          isDemo ? "pb-36 sm:pb-36 lg:pb-32" : ""
        }`}
      >
        <div className="fixed top-4 right-6 z-30 hidden lg:block print:hidden">
          <NotificationBell />
        </div>
        <VerifyEmailBanner />
        {children}
      </main>
      <DemoExperience />
    </ActiveProjectProvider>
  );
}
