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
        className={`shrink-0 rounded-full object-cover ${className}`}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div
      style={style}
      className={`flex shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white ${className}`}
    >
      {initials(user)}
    </div>
  );
}
