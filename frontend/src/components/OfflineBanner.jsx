import React from 'react';
import { CheckCircle2, WifiOff } from 'lucide-react';

export default function OfflineBanner({
  restored = false,
  title,
  message,
}) {
  return (
    <div className={restored ? 'degradation-banner degradation-banner--restored' : 'degradation-banner degradation-banner--offline'} role="status" aria-live="polite">
      {restored ? <CheckCircle2 size={21} /> : <WifiOff size={21} />}
      <div>
        <strong>{title || (restored ? 'Connection restored' : 'Offline')}</strong>
        <span>{message || (restored ? 'Synchronizing saved records…' : 'Your work is being saved on this device.')}</span>
      </div>
    </div>
  );
}
