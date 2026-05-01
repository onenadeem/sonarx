import { formatDateSeparator } from './formatTime';
export function isSameDay(a, b) {
    const dateA = typeof a === 'number' ? new Date(a) : a;
    const dateB = typeof b === 'number' ? new Date(b) : b;
    return (dateA.getFullYear() === dateB.getFullYear() &&
        dateA.getMonth() === dateB.getMonth() &&
        dateA.getDate() === dateB.getDate());
}
export function groupMessagesByDate(messages) {
    if (messages.length === 0)
        return [];
    const groups = [];
    let currentGroup = null;
    for (const message of messages) {
        const sentAt = message.sentAt instanceof Date ? message.sentAt : new Date(message.sentAt);
        if (!currentGroup || !isSameDay(currentGroup.date, sentAt)) {
            currentGroup = {
                date: sentAt,
                dateLabel: formatDateSeparator(sentAt),
                messages: [],
            };
            groups.push(currentGroup);
        }
        currentGroup.messages.push(message);
    }
    return groups;
}
