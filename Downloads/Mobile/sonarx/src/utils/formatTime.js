import {
  format,
  isToday,
  isYesterday,
  isThisWeek,
  isThisYear,
  differenceInMinutes,
  differenceInHours,
} from "date-fns";

const WEEK_OPTIONS = { weekStartsOn: 1 };

const toDate = (value) => (typeof value === "number" ? new Date(value) : value);

export function formatMessageTime(date) {
  const d = toDate(date);
  const now = new Date();
  const minutesAgo = differenceInMinutes(now, d);
  if (minutesAgo < 1) return "just now";
  if (minutesAgo < 60) return `${minutesAgo}m`;
  if (isToday(d)) return format(d, "HH:mm");
  if (isThisWeek(d, WEEK_OPTIONS)) return format(d, "EEE");
  if (isThisYear(d)) return format(d, "MMM d");
  return format(d, "MMM d, yyyy");
}
export function formatChatBubbleTimestamp(date) {
  const d = toDate(date);
  return format(d, "MMM d \u2022 HH:mm");
}
export function formatDateSeparator(date) {
  const d = toDate(date);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  if (isThisWeek(d, WEEK_OPTIONS)) return format(d, "EEEE");
  if (isThisYear(d)) return format(d, "MMM d");
  return format(d, "MMM d, yyyy");
}
export function formatLastSeen(date) {
  if (!date) return "Last seen a while ago";
  const d = toDate(date);
  const now = new Date();
  const minutesAgo = differenceInMinutes(now, d);
  const hoursAgo = differenceInHours(now, d);
  if (minutesAgo < 1) return "Online";
  if (minutesAgo === 1) return "Last seen 1 minute ago";
  if (minutesAgo < 60) return `Last seen ${minutesAgo} minutes ago`;
  if (hoursAgo === 1) return "Last seen 1 hour ago";
  if (hoursAgo < 24) return `Last seen ${hoursAgo} hours ago`;
  if (isThisWeek(d, WEEK_OPTIONS)) return `Last seen ${format(d, "EEEE")}`;
  if (isThisYear(d)) return `Last seen ${format(d, "MMM d")}`;
  return `Last seen ${format(d, "MMM d, yyyy")}`;
}
export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
export function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
