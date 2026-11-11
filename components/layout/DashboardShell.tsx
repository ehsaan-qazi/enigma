"use client";

import React, { useState, Suspense } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export interface DashboardShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function DashboardShell({
  children,
  title,
  subtitle,
}: DashboardShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F7F8FA]">
      {/* Sidebar with Suspense boundary for usePathname() */}
      <Suspense fallback={<div className="hidden lg:block w-64 bg-white border-r border-[#E8EAF0]" />}>
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      </Suspense>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          onMenuToggle={() => setIsSidebarOpen(true)}
          title={title}
          subtitle={subtitle}
        />

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
