export function StatusBadge({ status }: { status: string }) {
  const label = status.charAt(0) + status.slice(1).toLowerCase();
  return <span className={`status-badge status-badge--${status.toLowerCase()}`}>{label}</span>;
}
