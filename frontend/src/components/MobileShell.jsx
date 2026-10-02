import React from 'react';

/**
 * Driver screens are mobile-first, but this shell expands into a proper
 * responsive web-app surface on tablet/desktop. The component name is kept
 * so existing imports and flows remain unchanged.
 */
export default function MobileShell({ children, className = '' }) {
  return (
    <div className="app-stage">
      <main className={`mobile-shell ${className}`}>{children}</main>
    </div>
  );
}
