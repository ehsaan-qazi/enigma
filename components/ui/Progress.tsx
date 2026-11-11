import React from "react";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  label?: string;
  showValueLabel?: boolean;
  size?: "sm" | "md" | "lg";
  color?: "primary" | "success" | "warning" | "danger";
}

export function Progress({
  value,
  max = 100,
  label,
  showValueLabel = false,
  size = "md",
  color = "primary",
  className = "",
  ...props
}: ProgressProps) {
  const percentage = Math.min(Math.max(Math.round((value / max) * 100), 0), 100);

  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  const colorClasses = {
    primary: "bg-[#4F46E5]",
    success: "bg-[#16A34A]",
    warning: "bg-[#D97706]",
    danger: "bg-[#DC2626]",
  };

  return (
    <div className={`w-full ${className}`} {...props}>
      {(label || showValueLabel) && (
        <div className="flex justify-between items-center mb-1.5 text-xs text-[#697080]">
          {label && <span className="font-medium text-[#171923]">{label}</span>}
          {showValueLabel && <span>{percentage}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        className={`w-full bg-[#E8EAF0] rounded-full overflow-hidden ${sizeClasses[size]}`}
      >
        <div
          className={`${colorClasses[color]} h-full transition-all duration-300 ease-out rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
