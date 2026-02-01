import { useLocalStorage } from "@mantine/hooks";
import { useCallback, useEffect, useMemo, useRef } from "react";

export const APP_LOCK_ID_KEY = "XMTP_APP_LOCK_ID";
export const APP_LOCK_LAST_ACTIVE_KEY = "XMTP_APP_LOCK_LAST_ACTIVE";
// interval to set the last active time
export const ACTIVE_INTERVAL = 2000;
// time threshold (ms) to consider the lock stale
export const STALE_THRESHOLD = 30000;

/**
 * App lock state
 * - active: the current session has the lock
 * - locked: another session has the lock
 * - available: no active sessions
 */
export type AppLockState = "active" | "locked" | "available";

/**
 * Check if the lock is stale
 * @param lastActive - the last active time
 * @returns true if the lock is stale
 */
const isLockStale = (lastActive: number | null) => {
  return lastActive === null || Date.now() - lastActive > STALE_THRESHOLD;
};

export const useAppLock = (onLockLost?: () => void) => {
  // random UUID to identify the lock
  const lockIdRef = useRef(crypto.randomUUID());
  // flag to track if the lock has been acquired
  const hadLockRef = useRef(false);
  // lock ID stored in local storage
  const [lockId, setLockId] = useLocalStorage<string | null>({
    key: APP_LOCK_ID_KEY,
    defaultValue: null,
    getInitialValueInEffect: false,
  });
  // last active time stored in local storage
  const [lastActive, setLastActive] = useLocalStorage<number | null>({
    key: APP_LOCK_LAST_ACTIVE_KEY,
    defaultValue: null,
    getInitialValueInEffect: false,
  });
  // lastActive ref to avoid re-renders
  const lastActiveRef = useRef(lastActive);
  lastActiveRef.current = lastActive;

  const lockState: AppLockState = useMemo(() => {
    if (lockId === null) {
      return "available";
    }
    if (lockId === lockIdRef.current) {
      return "active";
    }
    if (isLockStale(lastActive)) {
      return "available";
    }
    return "locked";
  }, [lockId, lastActive]);

  /**
   * Acquire the lock
   * @param force - force the lock to be acquired
   * @returns true if the lock was acquired
   */
  const acquireLock = useCallback(
    (force?: boolean) => {
      // if the lock is not stale and acquired by another session, don't acquire it
      // unless force is true
      if (
        !isLockStale(lastActiveRef.current) &&
        lockId !== null &&
        lockId !== lockIdRef.current &&
        !force
      ) {
        return false;
      }
      // acquire the lock
      setLockId(lockIdRef.current);
      setLastActive(Date.now());
      // lock acquired, set the flag to true
      hadLockRef.current = true;
      return true;
    },
    [lockId, setLockId, setLastActive],
  );

  const releaseLock = useCallback((): void => {
    hadLockRef.current = false;
    setLockId(null);
    setLastActive(null);
  }, [setLockId, setLastActive]);

  // if the lock is lost, call the onLockLost callback
  // this is helpful for disconnecting the user when the lock is lost
  useEffect(() => {
    if (lockState !== "active" && hadLockRef.current) {
      hadLockRef.current = false;
      onLockLost?.();
    }
  }, [lockState, onLockLost]);

  // heartbeat to keep lock alive when active
  useEffect(() => {
    // if the lock is not active or the lock ID is not the current session,
    // don't update the last active time
    if (lockState !== "active" || lockId !== lockIdRef.current) {
      return;
    }

    // update the last active time at the set interval
    const interval = setInterval(() => {
      setLastActive(Date.now());
    }, ACTIVE_INTERVAL);

    return () => {
      clearInterval(interval);
    };
  }, [lockState, lockId, setLastActive]);

  // release lock on pagehide event
  useEffect(() => {
    // if the lock is not active or the lock ID is not the current session,
    // don't release the lock
    if (lockState !== "active" || lockId !== lockIdRef.current) {
      return;
    }

    const handlePageHide = () => {
      releaseLock();
    };

    window.addEventListener("pagehide", handlePageHide);
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [lockState, lockId, setLastActive]);

  return { lockState, acquireLock, releaseLock };
};
