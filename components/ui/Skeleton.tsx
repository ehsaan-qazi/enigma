import React from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular";
}

export function Skeleton({
  variant = "text",
  className = "",
  ...props
}: SkeletonProps) {
  const variantStyles = {
    text: "h-4 w-full rounded",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  return (
    <div
      aria-hidden="true"
      className={`animate-pulse bg-[#E8EAF0]/80 ${variantStyles[variant]} ${className}`}
      {...props}
    />
  );
}
