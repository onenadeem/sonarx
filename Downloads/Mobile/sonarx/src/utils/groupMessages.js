import { formatDateSeparator } from './formatTime';
const toDate = (value) => (typeof value === "number" ? new Date(value) : value);
export function isSameDay(a, b) {
    const dateA = toDate(a);
    const dateB = toDate(b);
    return (dateA.getFullYear() === dateB.getFullYear() &&
        dateA.getMonth() === dateB.getMonth() &&
        dateA.getDate() === dateB.getDate());
}
export function groupMessagesByDate(messages) {
    if (messages.length === 0) {
        return [];
    }
    return messages.reduce((groups, message) => {
        const sentAt = toDate(message.sentAt);
        const activeGroup = groups[groups.length - 1];
        if (!activeGroup || !isSameDay(activeGroup.date, sentAt)) {
            groups.push({
                date: sentAt,
                dateLabel: formatDateSeparator(sentAt),
                messages: [],
            });
        }
        groups[groups.length - 1].messages.push(message);
        return groups;
    }, []);
}
