// The signed-in user as a list row: their GitHub picture in a round avatar (their initials until it loads or when it fails),
// their name and a line under it. Exposes AccountRow. Uses ListItem (ui.tsx) and lib/account.mjs; the main drawer's header
// (MainMenu.tsx) and the account screen (Library.tsx) show it.
import { useEffect, useState } from 'react';
import { avatarOf, initialsOf } from '../lib/account.mjs';
import type { Viewer } from './github';
import { ListItem, plainListClass } from './ui';

/** The user's avatar, name (`user.name`, or the login) and `supporting` under it, each on one line; a link when `href` is set. */
export function AccountRow({ user, supporting, href }: { user: Viewer; supporting?: string; href?: string }) {
  const initials = initialsOf(user.name, user.login);
  const src = avatarOf(user.login, 80);
  const [loaded, setLoaded] = useState(false);
  // The picture is loaded beforehand; the initials stand in until it is there and for good when it fails.
  useEffect(() => {
    setLoaded(false);
    const image = new Image();
    image.onload = () => setLoaded(true);
    image.src = src;
    return () => {
      image.onload = null;
    };
  }, [src]);
  return (
    <ul className={plainListClass}>
      <ListItem
        href={href}
        leadingAvatar={loaded ? { src } : initials}
        headline={user.name ?? user.login}
        supporting={supporting}
        truncate
      />
    </ul>
  );
}
