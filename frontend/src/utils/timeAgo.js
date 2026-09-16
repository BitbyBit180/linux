// Format a date as a compact relative timestamp for post/comment meta lines.
// "just now" / "5m ago" / "3h ago" / "2d ago" / "Jan 5" (+" ,2025" if not this year)
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function timeAgo(date) {
  if (!date) return '';
  const then = new Date(date).getTime();
  if (Number.isNaN(then)) return '';

  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));

  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  if (secs < 7 * 86400) return `${Math.floor(secs / 86400)}d ago`;

  const d = new Date(then);
  const label = `${MONTHS[d.getMonth()]} ${d.getDate()}`;
  return d.getFullYear() === new Date().getFullYear()
    ? label
    : `${label}, ${d.getFullYear()}`;
}

export default timeAgo;
