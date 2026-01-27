import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ACTIVE_INTERVAL,
  APP_LOCK_ID_KEY,
  APP_LOCK_LAST_ACTIVE_KEY,
  STALE_THRESHOLD,
  useAppLock,
} from "./useAppLock";

describe("useAppLock", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("initial state", () => {
    it("returns 'available' when no lock exists", () => {
      const { result } = renderHook(() => useAppLock());
      expect(result.current.lockState).toBe("available");
    });

    it("returns 'locked' when another session has the lock", () => {
      localStorage.setItem(APP_LOCK_ID_KEY, JSON.stringify("other-session-id"));
      localStorage.setItem(
        APP_LOCK_LAST_ACTIVE_KEY,
        JSON.stringify(Date.now()),
      );

      const { result } = renderHook(() => useAppLock());
      expect(result.current.lockState).toBe("locked");
    });

    it("returns 'available' when lock exists but is stale", () => {
      localStorage.setItem(APP_LOCK_ID_KEY, JSON.stringify("other-session-id"));
      localStorage.setItem(
        APP_LOCK_LAST_ACTIVE_KEY,
        JSON.stringify(Date.now() - STALE_THRESHOLD - 1),
      );

      const { result } = renderHook(() => useAppLock());
      expect(result.current.lockState).toBe("available");
    });

    it("returns 'available' when lock exists but lastActive is null", () => {
      localStorage.setItem(APP_LOCK_ID_KEY, JSON.stringify("other-session-id"));
      localStorage.setItem(APP_LOCK_LAST_ACTIVE_KEY, JSON.stringify(null));

      const { result } = renderHook(() => useAppLock());
      expect(result.current.lockState).toBe("available");
    });
  });

  describe("acquireLock", () => {
    it("acquires lock when no lock exists", () => {
      const { result } = renderHook(() => useAppLock());

      let acquired: boolean;
      act(() => {
        acquired = result.current.acquireLock();
      });

      expect(acquired!).toBe(true);
      expect(result.current.lockState).toBe("active");
      expect(localStorage.getItem(APP_LOCK_ID_KEY)).not.toBeNull();
    });

    it("does not acquire lock when another session has it", () => {
      localStorage.setItem(APP_LOCK_ID_KEY, JSON.stringify("other-session-id"));
      localStorage.setItem(
        APP_LOCK_LAST_ACTIVE_KEY,
        JSON.stringify(Date.now()),
      );

      const { result } = renderHook(() => useAppLock());

      let acquired: boolean;
      act(() => {
        acquired = result.current.acquireLock();
      });

      expect(acquired!).toBe(false);
      expect(result.current.lockState).toBe("locked");
    });

    it("force acquires lock even when another session has it", () => {
      localStorage.setItem(APP_LOCK_ID_KEY, JSON.stringify("other-session-id"));
      localStorage.setItem(
        APP_LOCK_LAST_ACTIVE_KEY,
        JSON.stringify(Date.now()),
      );

      const { result } = renderHook(() => useAppLock());

      let acquired: boolean;
      act(() => {
        acquired = result.current.acquireLock(true);
      });

      expect(acquired!).toBe(true);
      expect(result.current.lockState).toBe("active");
    });
  });

  describe("releaseLock", () => {
    it("releases the lock by setting values to null", () => {
      const { result } = renderHook(() => useAppLock());

      act(() => {
        result.current.acquireLock();
      });

      expect(result.current.lockState).toBe("active");

      act(() => {
        result.current.releaseLock();
      });

      expect(result.current.lockState).toBe("available");
      expect(JSON.parse(localStorage.getItem(APP_LOCK_ID_KEY)!)).toBeNull();
    });

    it("releases the lock when another session has it", () => {
      localStorage.setItem(APP_LOCK_ID_KEY, JSON.stringify("other-session-id"));
      localStorage.setItem(
        APP_LOCK_LAST_ACTIVE_KEY,
        JSON.stringify(Date.now()),
      );
      const { result } = renderHook(() => useAppLock());

      act(() => {
        result.current.acquireLock();
      });

      expect(result.current.lockState).toBe("locked");

      act(() => {
        result.current.releaseLock();
      });

      expect(result.current.lockState).toBe("available");
      expect(JSON.parse(localStorage.getItem(APP_LOCK_ID_KEY)!)).toBeNull();
    });
  });

  describe("onLockLost callback", () => {
    it("calls onLockLost when another session takes the lock", () => {
      const onLockLost = vi.fn();

      const { result } = renderHook(() => useAppLock(onLockLost));

      act(() => {
        result.current.acquireLock();
      });

      expect(result.current.lockState).toBe("active");

      // simulate another session taking the lock via storage event
      act(() => {
        const newLockId = JSON.stringify("other-session-id");
        localStorage.setItem(APP_LOCK_ID_KEY, newLockId);

        window.dispatchEvent(
          new StorageEvent("storage", {
            key: APP_LOCK_ID_KEY,
            newValue: newLockId,
            storageArea: localStorage,
          }),
        );
      });

      expect(onLockLost).toHaveBeenCalled();
      expect(result.current.lockState).toBe("locked");
    });

    it("does not call onLockLost if lock was never acquired", () => {
      const onLockLost = vi.fn();

      renderHook(() => useAppLock(onLockLost));

      // simulate another session taking the lock via storage event
      act(() => {
        const newLockId = JSON.stringify("other-session-id");
        localStorage.setItem(APP_LOCK_ID_KEY, newLockId);

        window.dispatchEvent(
          new StorageEvent("storage", {
            key: APP_LOCK_ID_KEY,
            newValue: newLockId,
            storageArea: localStorage,
          }),
        );
      });

      expect(onLockLost).not.toHaveBeenCalled();
    });
  });

  describe("heartbeat", () => {
    it("updates lastActive at interval when lock is active", () => {
      const { result } = renderHook(() => useAppLock());

      act(() => {
        result.current.acquireLock();
      });

      const initialLastActive = JSON.parse(
        localStorage.getItem(APP_LOCK_LAST_ACTIVE_KEY)!,
      ) as number;

      act(() => {
        vi.advanceTimersByTime(ACTIVE_INTERVAL);
      });

      const updatedLastActive = JSON.parse(
        localStorage.getItem(APP_LOCK_LAST_ACTIVE_KEY)!,
      ) as number;

      expect(updatedLastActive).toBeGreaterThan(initialLastActive);
    });

    it("clears interval on unmount", () => {
      const { result, unmount } = renderHook(() => useAppLock());

      act(() => {
        result.current.acquireLock();
      });

      const lastActiveBeforeUnmount = JSON.parse(
        localStorage.getItem(APP_LOCK_LAST_ACTIVE_KEY)!,
      ) as number;

      unmount();

      act(() => {
        vi.advanceTimersByTime(ACTIVE_INTERVAL);
      });

      const lastActiveAfterUnmount = JSON.parse(
        localStorage.getItem(APP_LOCK_LAST_ACTIVE_KEY)!,
      ) as number;

      expect(lastActiveAfterUnmount).toBe(lastActiveBeforeUnmount);
    });
  });

  describe("pagehide event", () => {
    it("releases lock on pagehide when lock is active", () => {
      const { result } = renderHook(() => useAppLock());

      act(() => {
        result.current.acquireLock();
      });

      expect(result.current.lockState).toBe("active");

      act(() => {
        window.dispatchEvent(new Event("pagehide"));
      });

      expect(JSON.parse(localStorage.getItem(APP_LOCK_ID_KEY)!)).toBeNull();
    });

    it("does not release lock on pagehide when lock is not active", () => {
      localStorage.setItem(APP_LOCK_ID_KEY, JSON.stringify("other-session-id"));
      localStorage.setItem(
        APP_LOCK_LAST_ACTIVE_KEY,
        JSON.stringify(Date.now()),
      );

      renderHook(() => useAppLock());

      act(() => {
        window.dispatchEvent(new Event("pagehide"));
      });

      // Lock should still belong to other session
      expect(JSON.parse(localStorage.getItem(APP_LOCK_ID_KEY)!)).toBe(
        "other-session-id",
      );
    });

    it("adds event listener on mount and removes on unmount", () => {
      const addEventListenerSpy = vi.spyOn(window, "addEventListener");
      const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

      const { result, unmount } = renderHook(() => useAppLock());

      act(() => {
        result.current.acquireLock();
      });

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "pagehide",
        expect.any(Function),
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "pagehide",
        expect.any(Function),
      );

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });
});
