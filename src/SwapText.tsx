// A focusable span that swaps its text for another on a click or Enter/Space, and back (no link or button look: it inherits the text).
// Exposes SwapText. Depends on nothing.
import { useState } from 'react';

export function SwapText({ text, swapped, title }: { text: string; swapped: string; title?: string }) {
  const [on, setOn] = useState(false);
  return (
    <span
      tabIndex={0}
      title={title}
      onClick={() => setOn((was) => !was)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setOn((was) => !was);
        }
      }}
    >
      {on ? swapped : text}
    </span>
  );
}
