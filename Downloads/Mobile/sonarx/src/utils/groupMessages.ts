import type { Message } from '@/db/schema'
import { formatDateSeparator } from './formatTime'

export interface MessageGroup {
  date: Date
  dateLabel: string
  messages: Message[]
}

export function isSameDay(a: Date | number, b: Date | number): boolean {
  const dateA = typeof a === 'number' ? new Date(a) : a
  const dateB = typeof b === 'number' ? new Date(b) : b
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  )
}

export function groupMessagesByDate(messages: Message[]): MessageGroup[] {
  if (messages.length === 0) return []

  const groups: MessageGroup[] = []
  let currentGroup: MessageGroup | null = null

  for (const message of messages) {
    const sentAt = message.sentAt instanceof Date ? message.sentAt : new Date(message.sentAt)

    if (!currentGroup || !isSameDay(currentGroup.date, sentAt)) {
      currentGroup = {
        date: sentAt,
        dateLabel: formatDateSeparator(sentAt),
        messages: [],
      }
      groups.push(currentGroup)
    }

    currentGroup.messages.push(message)
  }

  return groups
}
