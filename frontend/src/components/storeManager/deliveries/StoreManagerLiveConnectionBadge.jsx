import {
  Clock3,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";

import {
  STORE_MANAGER_LIVE_STATUS,
} from "../../../services/storeManagerLiveService";

function StoreManagerLiveConnectionBadge({
  status,
  t,
  compact = false,
}) {
  const config = getStatusConfig(status, t);
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-bold ${
        compact
          ? "h-8 px-2.5 text-[9.5px]"
          : "h-9 px-3 text-[10px]"
      } ${config.className}`}
      title={config.title}
      aria-live="polite"
    >
      <Icon
        size={compact ? 12.5 : 13.5}
        className={config.spin ? "animate-spin" : ""}
      />
      {config.label}
    </span>
  );
}

function getStatusConfig(status, t) {
  if (status === STORE_MANAGER_LIVE_STATUS.LIVE) {
    return {
      icon: Wifi,
      label: t("storeManager.liveStatusLive"),
      title: t("storeManager.liveStatusLiveHint"),
      className:
        "border-[var(--color-primary)]/25 bg-[var(--color-primary-soft)]/55 text-[var(--color-primary-strong)]",
    };
  }

  if (status === STORE_MANAGER_LIVE_STATUS.OFFLINE) {
    return {
      icon: WifiOff,
      label: t("storeManager.liveStatusOffline"),
      title: t("storeManager.liveStatusOfflineHint"),
      className:
        "border-[var(--color-border)] bg-[var(--color-surface-soft)] text-[var(--color-text-secondary)]",
    };
  }

  if (status === STORE_MANAGER_LIVE_STATUS.STALE) {
    return {
      icon: Clock3,
      label: t("storeManager.liveStatusStale"),
      title: t("storeManager.liveStatusStaleHint"),
      className:
        "border-[var(--color-warning)]/30 bg-[var(--color-warning-soft)] text-[var(--color-text)]",
    };
  }

  return {
    icon: RefreshCw,
    label:
      status === STORE_MANAGER_LIVE_STATUS.RECONNECTING
        ? t("storeManager.liveStatusReconnecting")
        : t("storeManager.liveStatusConnecting"),
    title:
      status === STORE_MANAGER_LIVE_STATUS.RECONNECTING
        ? t("storeManager.liveStatusReconnectingHint")
        : t("storeManager.liveStatusConnectingHint"),
    spin: true,
    className:
      "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]",
  };
}

export default StoreManagerLiveConnectionBadge;
