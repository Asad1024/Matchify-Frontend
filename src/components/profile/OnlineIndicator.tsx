/**
 * Small green “online” marker — position with `className="absolute ..."` on a `relative` parent.
 */
export function OnlineIndicator({ className = "" }: { className?: string }) {
  return (
    <span
      className={`box-border block h-3 w-3 rounded-full border-2 border-white bg-emerald-500 shadow-sm ${className}`}
      title="Online"
      aria-label="Online"
    />
  );
}
