"use client";

import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";

export interface HeaderProps {
  onMenuToggle?: () => void;
  title?: string;
  subtitle?: string;
}

export function Header({ onMenuToggle, title, subtitle }: HeaderProps) {
  const [userLabel, setUserLabel] = useState("Student Portal");
  const [initials, setInitials] = useState("ST");

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const user = json?.data?.user || json?.user;
        if (user) {
          const name = user.fullName || user.email || "Student Portal";
          setUserLabel(name);
          const parts = String(name)
            .trim()
            .split(/\s+/)
            .filter(Boolean);
          if (parts.length >= 2) {
            setInitials(`${parts[0][0]}${parts[1][0]}`.toUpperCase());
          } else if (parts.length === 1 && parts[0].length >= 2) {
            setInitials(parts[0].slice(0, 2).toUpperCase());
          }
        }
      })
      .catch(() => {
        // Retain default portal label
      });
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-xs border-b border-[#E8EAF0] px-4 sm:px-6 lg:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            type="button"
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg text-[#697080] hover:text-[#171923] hover:bg-[#F7F8FA] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
            aria-label="Toggle navigation menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <div className="flex flex-col">
          {title && (
            <h1 className="text-sm font-semibold text-[#171923] tracking-tight">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-xs text-[#697080] hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <Badge variant="primary" size="sm" className="hidden sm:inline-flex">
          Academic Viva Platform
        </Badge>

        <div className="flex items-center gap-2 pl-2 border-l border-[#E8EAF0]">
          <div className="w-8 h-8 rounded-full bg-[#EEF2FF] border border-[#4F46E5]/20 flex items-center justify-center text-xs font-semibold text-[#4F46E5]">
            {initials}
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-medium text-[#171923] max-w-[160px] truncate">
              {userLabel}
            </span>
            <span className="text-[10px] text-[#697080]">Active Session</span>
          </div>
        </div>
      </div>
    </header>
  );
}
