import {
  format,
  isToday,
  isYesterday,
  isThisWeek,
  isThisYear,
  differenceInMinutes,
  differenceInHours,
} from 'date-fns'

export function formatMessageTime(date: Date | number): string {
  const d = typeof date === 'number' ? new Date(date) : date
  const now = new Date()
  const minutesAgo = differenceInMinutes(now, d)

  if (minutesAgo < 1) return 'just now'
  if (minutesAgo < 60) return `${minutesAgo}m`
  if (isToday(d)) return format(d, 'HH:mm')
  if (isThisWeek(d, { weekStartsOn: 1 })) return format(d, 'EEE')
  if (isThisYear(d)) return format(d, 'MMM d')
  return format(d, 'MMM d, yyyy')
}

export function formatDateSeparator(date: Date | number): string {
  const d = typeof date === 'number' ? new Date(date) : date

  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  if (isThisWeek(d, { weekStartsOn: 1 })) return format(d, 'EEEE')
  if (isThisYear(d)) return format(d, 'MMM d')
  return format(d, 'MMM d, yyyy')
}

export function formatLastSeen(date: Date | number | null): string {
  if (!date) return 'Last seen a while ago'

  const d = typeof date === 'number' ? new Date(date) : date
  const now = new Date()
  const minutesAgo = differenceInMinutes(now, d)
  const hoursAgo = differenceInHours(now, d)

  if (minutesAgo < 1) return 'Online'
  if (minutesAgo === 1) return 'Last seen 1 minute ago'
  if (minutesAgo < 60) return `Last seen ${minutesAgo} minutes ago`
  if (hoursAgo === 1) return 'Last seen 1 hour ago'
  if (hoursAgo < 24) return `Last seen ${hoursAgo} hours ago`
  if (isThisWeek(d, { weekStartsOn: 1 })) return `Last seen ${format(d, 'EEEE')}`
  if (isThisYear(d)) return `Last seen ${format(d, 'MMM d')}`
  return `Last seen ${format(d, 'MMM d, yyyy')}`
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
