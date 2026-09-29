import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  label: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
}

export function Chip({ icon: Icon, label, className = "", size = "md", pulse = false }: Props) {
  const sizes = {
    sm: "h-7 px-2.5 text-[0.72rem] gap-1.5",
    md: "h-8 px-3 text-[0.8rem] gap-1.5",
    lg: "h-11 px-4 text-[0.95rem] gap-2",
  }[size];
  return (
    <span className={`inline-flex items-center rounded-full font-bold uppercase tracking-[0.06em] whitespace-nowrap ${sizes} ${className}`}>
      <Icon size={size === "lg" ? 18 : 14} strokeWidth={2.5} aria-hidden="true" className={pulse ? "animate-pop" : ""} />
      <span>{label}</span>
    </span>
  );
}
