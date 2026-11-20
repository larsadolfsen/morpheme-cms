// The inside of a busy Button or IconButton (.mo-button__busy-content, .mo-button__busy-indicator in ../styles/ui/buttons.css): the
// usual content, hidden after the delay, and a loading indicator (aria-hidden) in the middle. Exposes BusyContent.
// Reuses loadingIndicatorClass from ./LoadingIndicator.
import type { ReactNode } from 'react';
import { loadingIndicatorClass } from './LoadingIndicator';

export default function BusyContent({ children }: { children: ReactNode }) {
  return (
    <>
      <span className="mo-button__busy-content">{children}</span>
      <span className={`${loadingIndicatorClass()} mo-button__busy-indicator`} aria-hidden="true">
        <span className="mo-loading-indicator__shape"></span>
      </span>
    </>
  );
}
