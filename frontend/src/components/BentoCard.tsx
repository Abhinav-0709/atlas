import { ReactNode } from "react";

interface BentoCardProps {
  children: ReactNode;
  variant?: "lime" | "blue" | "black" | "cream" | "white";
  className?: string;
  rounded?: "2xl" | "3xl" | "4xl";
}

export default function BentoCard({
  children,
  variant = "white",
  className = "",
  rounded = "3xl",
}: BentoCardProps) {
  const roundedClass = {
    "2xl": "rounded-2xl",
    "3xl": "rounded-[28px]",
    "4xl": "rounded-[36px]",
  }[rounded];

  const variantStyles = {
    lime: "bg-atlas-lime text-atlas-black border-2 border-black/15 shadow-sm",
    blue: "bg-atlas-blue text-white border-2 border-black/15 shadow-sm",
    black: "bg-atlas-black text-white border border-white/10 shadow-md",
    cream: "bg-atlas-cream text-atlas-black border-2 border-black/15 shadow-sm",
    white: "bg-white text-atlas-black border border-black/10 shadow-sm",
  }[variant];

  return (
    <div
      className={`relative overflow-hidden transition-all duration-200 ${roundedClass} ${variantStyles} ${className}`}
    >
      {children}
    </div>
  );
}
