import { useCallback, useState } from "react";

// Global state to track conversation updates
let refreshCounter = 0;
const refreshListeners = new Set<() => void>();

const notifyRefresh = () => {
  refreshCounter++;
  refreshListeners.forEach((listener) => {
    listener();
  });
};

export const useConversationRefresh = () => {
  const [refreshKey, setRefreshKey] = useState(refreshCounter);

  const refresh = useCallback(() => {
    notifyRefresh();
  }, []);

  // Subscribe to global refresh events
  const subscribe = useCallback(() => {
    const handleRefresh = () => {
      setRefreshKey(refreshCounter);
    };
    refreshListeners.add(handleRefresh);

    return () => {
      refreshListeners.delete(handleRefresh);
    };
  }, []);

  return {
    refreshKey,
    refresh,
    subscribe,
  };
};

// Export a function to trigger refresh from anywhere
export const triggerConversationRefresh = () => {
  notifyRefresh();
};
