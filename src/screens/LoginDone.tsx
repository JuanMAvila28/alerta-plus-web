import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Screen } from '../components/Screen';
import { getAuthState, refreshSession } from '../lib/auth';
import { useLanguage } from '../lib/i18n';
import { takeReturnTo } from '../lib/loginReturn';
import { syncNow } from '../lib/sync';
import { newTexts } from '../newTexts';

/** /login/ok: the Worker set the refresh cookie; exchange it for the session (plan section 7.3). */
export default function LoginDone() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    void refreshSession().then((result) => {
      if (!active) return;
      if (result.status !== 'ok') {
        navigate('/login?error=session', { replace: true });
        return;
      }
      const { session } = getAuthState();
      if (!session?.dataConsent) {
        navigate('/bienvenida', { replace: true });
        return;
      }
      // First login on this device (or another account): the server copy wins.
      void syncNow({ preferServer: result.previousUserId !== session.user.id });
      navigate(takeReturnTo(), { replace: true });
    });
    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <Screen>
      <p role="status" className="mt-16 text-center text-xl">
        {t(newTexts.login.entering)}
      </p>
    </Screen>
  );
}
