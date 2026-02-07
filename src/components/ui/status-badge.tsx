type StatusVariant = "cyan" | "green" | "amber" | "red" | "gray";

interface StatusBadgeProps {
  label: string;
  variant?: StatusVariant;
  showDot?: boolean;
}

const variantClasses: Record<StatusVariant, { badge: string; dot: string }> = {
  cyan: {
    badge: "bg-cyan-500/15 text-cyan-400",
    dot: "bg-cyan-400",
  },
  green: {
    badge: "bg-emerald-500/15 text-emerald-400",
    dot: "bg-emerald-400",
  },
  amber: {
    badge: "bg-amber-500/15 text-amber-400",
    dot: "bg-amber-400",
  },
  red: {
    badge: "bg-red-500/15 text-red-400",
    dot: "bg-red-400",
  },
  gray: {
    badge: "bg-zinc-500/15 text-zinc-400",
    dot: "bg-zinc-400",
  },
};

export function StatusBadge({
  label,
  variant = "gray",
  showDot = true,
}: StatusBadgeProps) {
  const styles = variantClasses[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${styles.badge}`}
    >
      {showDot && <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />}
      {label}
    </span>
  );
}
