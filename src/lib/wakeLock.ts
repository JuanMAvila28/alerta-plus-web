// Keeps the screen on during the earthquake and protocols (plan F7).
import { useEffect } from 'react';

/** Holds a screen wake lock while `active`; asks again when the page comes back to the foreground. */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let stopped = false;

    const request = async () => {
      if (stopped || document.visibilityState !== 'visible' || (lock && !lock.released)) return;
      try {
        lock = await navigator.wakeLock.request('screen');
        if (stopped) void lock.release();
      } catch {
        // Denied (battery saver, no user gesture yet…): the protocol keeps working, the screen may dim.
      }
    };
    const onVisibility = () => void request();

    void request();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stopped = true;
      document.removeEventListener('visibilitychange', onVisibility);
      void lock?.release().catch(() => undefined);
    };
  }, [active]);
}
