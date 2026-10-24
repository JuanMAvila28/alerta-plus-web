// Premium status from the signed license, verified on the device (plan section 7.4).
import { useEffect, useState } from 'react';
import { useAuth } from './auth';
import { verifyLicense } from './license';

/** `undefined` while checking. Works offline: the license is never rejected for being old. */
export function usePremium(): boolean | undefined {
  const { session } = useAuth();
  const [premium, setPremium] = useState<boolean>();

  useEffect(() => {
    if (!session) {
      setPremium(false);
      return;
    }
    let active = true;
    void verifyLicense(session.license).then((license) => {
      // The license must belong to the account on this device.
      if (active) setPremium(license?.premium === true && license.userId === session.user.id);
    });
    return () => {
      active = false;
    };
  }, [session]);

  return premium;
}
