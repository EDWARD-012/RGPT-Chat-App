import { isToday, isYesterday, subDays } from 'date-fns';

// Groups chats by when they were last used, matching the order the API
// returns them in (most recently updated first).
export function groupChatsByDate(chats) {
  const groups = {
    today: [],
    yesterday: [],
    previous7Days: [],
    older: [],
  };

  if (!chats) return groups;

  const sevenDaysAgo = subDays(new Date(), 7);

  chats.forEach((chat) => {
    const date = new Date(chat.updated_at || chat.created_at);
    if (isToday(date)) {
      groups.today.push(chat);
    } else if (isYesterday(date)) {
      groups.yesterday.push(chat);
    } else if (date >= sevenDaysAgo) {
      groups.previous7Days.push(chat);
    } else {
      groups.older.push(chat);
    }
  });
  return groups;
}

export function initials(user) {
  const name = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.email || '?';
  return name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}
