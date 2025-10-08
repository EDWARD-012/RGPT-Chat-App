// src/lib/utils.js
import { isToday, isYesterday, isWithinInterval, subDays } from 'date-fns';

export function groupChatsByDate(chats) {
  const groups = {
    today: [],
    yesterday: [],
    previous7Days: [],
    older: [],
  };

  if (!chats) return groups;

  const now = new Date();
  const sevenDaysAgo = subDays(now, 7);

  chats.forEach(chat => {
    const chatDate = new Date(chat.created_at);
    if (isToday(chatDate)) {
      groups.today.push(chat);
    } else if (isYesterday(chatDate)) {
      groups.yesterday.push(chat);
    } else if (isWithinInterval(chatDate, { start: sevenDaysAgo, end: now })) {
      groups.previous7Days.push(chat);
    } else {
      groups.older.push(chat);
    }
  });
  return groups;
}