"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { DemoExperience } from "@/components/demo/DemoExperience";
import { ActiveProjectProvider } from "@/contexts/ActiveProjectContext";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, isAuthenticated } = useAuth();

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
      <Sidebar />
      <main
        className="min-h-screen p-8"
        style={{
          marginLeft: "var(--sidebar-width, 16rem)",
          transition: "margin-left 0.2s ease-out",
          willChange: "margin-left",
        }}
      >
        <div className="fixed top-4 right-6 z-30">
          <NotificationBell />
        </div>
        {children}
      </main>
      <DemoExperience />
    </ActiveProjectProvider>
  );
}
