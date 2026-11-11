import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "primary" | "success" | "warning" | "danger" | "outline";
  size?: "sm" | "md";
}

export function Badge({
  className = "",
  variant = "default",
  size = "md",
  children,
  ...props
}: BadgeProps) {
  const baseStyles =
    "inline-flex items-center font-medium rounded-full tracking-wide transition-colors";

  const variantStyles = {
    default: "bg-[#E8EAF0] text-[#171923]",
    primary: "bg-[#EEF2FF] text-[#4F46E5] border border-[#4F46E5]/20",
    success: "bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]",
    warning: "bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]",
    danger: "bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]",
    outline: "bg-transparent text-[#697080] border border-[#E8EAF0]",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px] leading-tight",
    md: "px-2.5 py-1 text-xs leading-none",
  };

  return (
    <span
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
