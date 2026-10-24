import { useState } from 'react';
import type { User } from '../types';

/** Google photo, or the initial when there is none or it cannot load (offline). */
export function Avatar({ user, size = 40 }: { user: User; size?: number }) {
  const [broken, setBroken] = useState(false);
  const initial = (user.name ?? user.email).trim().charAt(0).toUpperCase();
  const style = { width: size, height: size, fontSize: Math.round(size * 0.42) };

  if (user.photo && !broken) {
    return (
      <img
        src={user.photo}
        alt=""
        style={style}
        className="shrink-0 rounded-full object-cover"
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      style={style}
      className="flex shrink-0 items-center justify-center rounded-full bg-alert-blue font-display font-bold text-white"
    >
      {initial}
    </span>
  );
}
