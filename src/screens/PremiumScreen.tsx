import { useState } from 'react';
import { premiumContent, uiText } from '../content';
import { Button, MenuButton } from '../components/MenuButton';
import { Screen } from '../components/Screen';
import { showToast } from '../components/Toast';
import { getAuthState, refreshSession } from '../lib/auth';
import { useLanguage } from '../lib/i18n';
import { verifyLicense } from '../lib/license';
import { usePremium } from '../lib/premium';
import { newTexts } from '../newTexts';

/**
 * /premium (plan section 6.11). Payments (D2) and prices (D3) are pending:
 * the buy button stays disabled and the share discount waits for the checkout.
 */
export default function PremiumScreen() {
  const { t } = useLanguage();
  const premium = usePremium();
  const [restoring, setRestoring] = useState(false);
  const p = uiText.premium;

  // Brings the latest license (bought on another device, or granted on the server).
  const restore = async () => {
    setRestoring(true);
    const result = await refreshSession();
    setRestoring(false);
    if (result.status === 'offline') {
      showToast(t(newTexts.premium.needsConnection));
      return;
    }
    if (result.status !== 'ok') return; // Expired session: the sync status already says so.
    const license = await verifyLicense(getAuthState().session?.license);
    showToast(t(license?.premium ? newTexts.premium.restored : newTexts.premium.notFound));
  };

  return (
    <Screen>
      <h1 className="text-center text-[28px] font-bold">{t(p.title)}</h1>
      <p className="text-center text-lg">{t(p.description)}</p>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">{t(premiumContent.intro.title)}</h2>
        {premiumContent.intro.benefits.map((benefit) => (
          <div key={benefit.title.es} className="flex gap-3 rounded-xl bg-premium-card p-4">
            <span aria-hidden="true" className="text-2xl">
              {benefit.icon}
            </span>
            <div>
              <p className="text-lg font-bold">{t(benefit.title)}</p>
              <p className="text-base">{t(benefit.detail)}</p>
            </div>
          </div>
        ))}
      </section>

      {premium ? (
        <>
          <Button variant="blue" disabled>
            {t(p.active)}
          </Button>
          <MenuButton to="/premium/guias" variant="red">
            {t(premiumContent.library.title)}
          </MenuButton>
        </>
      ) : (
        <>
          <Button variant="blue" disabled>
            {t(p.buy)}
          </Button>
          <p className="text-center text-base text-slate-700">{t(newTexts.premium.comingSoon)}</p>
        </>
      )}

      {!premium && (
        <Button disabled={restoring} onClick={() => void restore()}>
          {t(p.restore)}
        </Button>
      )}
      <MenuButton to="/">{t(p.back)}</MenuButton>
    </Screen>
  );
}
