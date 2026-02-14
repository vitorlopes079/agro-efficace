interface LoadingSpinnerProps {
  /**
   * Size of the spinner: sm (16px), md (32px), lg (48px)
   * @default "md"
   */
  size?: "sm" | "md" | "lg";
  /**
   * Optional text to display below the spinner
   */
  text?: string;
  /**
   * Optional className for the container
   */
  className?: string;
  /**
   * Center the spinner with flex layout
   * @default true
   */
  centered?: boolean;
  /**
   * Minimum height for centered layout
   */
  minHeight?: string;
}

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-4",
  lg: "h-12 w-12 border-4",
};

/**
 * A reusable loading spinner component
 *
 * @example
 * // Simple spinner
 * <LoadingSpinner />
 *
 * @example
 * // With text
 * <LoadingSpinner text="Carregando projetos..." />
 *
 * @example
 * // Small inline spinner
 * <LoadingSpinner size="sm" centered={false} />
 *
 * @example
 * // Large spinner with custom height
 * <LoadingSpinner size="lg" text="Loading..." minHeight="400px" />
 */
export function LoadingSpinner({
  size = "md",
  text,
  className,
  centered = true,
  minHeight = "300px",
}: LoadingSpinnerProps) {
  const spinnerClasses = [
    "animate-spin rounded-full border-green-500 border-t-transparent",
    sizeClasses[size],
    !centered && className,
  ]
    .filter(Boolean)
    .join(" ");

  const spinner = <div className={spinnerClasses} />;

  if (!centered) {
    return spinner;
  }

  const containerClasses = ["flex items-center justify-center", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClasses} style={{ minHeight }}>
      <div className="text-center">
        <div className="mb-4 flex justify-center">{spinner}</div>
        {text && <p className="text-zinc-400">{text}</p>}
      </div>
    </div>
  );
}

/**
 * A simple loading text component without spinner
 */
export function LoadingText({ text = "Carregando..." }: { text?: string }) {
  return <div className="text-zinc-400">{text}</div>;
}
