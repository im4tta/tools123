/** Placeholder block while content loads; the shimmer stops under reduced motion (globals.css). */
export function Skeleton({ className = "h-4 w-full" }: { className?: string }) {
  return <div aria-hidden className={`tool-skeleton rounded-md ${className}`} />;
}
