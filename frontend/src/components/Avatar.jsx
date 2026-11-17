import { useState } from 'react';
import { initials } from '../lib/utils';

export default function Avatar({ user, size = 32, className = '' }) {
  const [failed, setFailed] = useState(false);
  const style = { width: size, height: size };

  if (user?.profile_picture_url && !failed) {
    return (
      <img
        src={user.profile_picture_url}
        alt=""
        style={style}
        className={`shrink-0 rounded-full border-2 border-ink object-cover dark:border-paper/20 ${className}`}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div
      style={style}
      className={`flex shrink-0 items-center justify-center rounded-full border-2 border-ink bg-chili font-mono text-xs font-bold text-ink ${className}`}
    >
      {initials(user)}
    </div>
  );
}
