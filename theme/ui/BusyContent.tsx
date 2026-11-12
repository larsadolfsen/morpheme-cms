// The inside of a busy Button or IconButton (.button-busy-content, .button-busy-indicator in ../styles/ui.css): the
// usual content, hidden after the delay, and a loading indicator (aria-hidden) in the middle. Exposes BusyContent.
// Reuses loadingIndicatorClass from ./LoadingIndicator.
import type { ReactNode } from 'react';
import { loadingIndicatorClass } from './LoadingIndicator';

export default function BusyContent({ children }: { children: ReactNode }) {
  return (
    <>
      <span className="button-busy-content">{children}</span>
      <span className={`${loadingIndicatorClass()} button-busy-indicator`} aria-hidden="true">
        <span className="loading-indicator-shape"></span>
      </span>
    </>
  );
}
