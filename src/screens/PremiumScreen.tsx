import {
  ArrowsClockwise,
  BookOpenText,
  Brain,
  Compass,
  HouseLine,
  Lightbulb,
  SealCheck,
  Star,
  type Icon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import { premiumContent, uiText } from '../content';
import { Button, MenuButton } from '../components/MenuButton';
import { HeaderIcon, Screen, ScreenHeader } from '../components/Screen';
import { showToast } from '../components/Toast';
import { getAuthState, refreshSession } from '../lib/auth';
import { withoutEmoji } from '../lib/emoji';
import { useLanguage } from '../lib/i18n';
import { verifyLicense } from '../lib/license';
import { usePremium } from '../lib/premium';
import { newTexts } from '../newTexts';

// The benefits carry an emoji in the content; the screen draws these instead, in the same order.
const BENEFIT_ICONS: Icon[] = [Compass, Lightbulb, Brain, HouseLine];
const ICON = { size: 20, weight: 'bold', 'aria-hidden': true } as const;

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
      <ScreenHeader
        title={withoutEmoji(t(p.title))}
        icon={
          <HeaderIcon className="bg-signal/15 text-signal">
            <Star size={28} weight="fill" aria-hidden="true" />
          </HeaderIcon>
        }
      >
        {t(p.description)}
      </ScreenHeader>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-[1.375rem] leading-tight font-bold text-ink">{t(premiumContent.intro.title)}</h2>
        <ul className="overflow-hidden rounded-[20px] bg-surface">
          {premiumContent.intro.benefits.map((benefit, index) => {
            const BenefitIcon = BENEFIT_ICONS[index] ?? Star;
            return (
              <li key={benefit.title.es} className="flex gap-4 border-b border-line p-4 last:border-b-0">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-page text-signal">
                  <BenefitIcon size={22} weight="bold" aria-hidden="true" />
                </span>
                <div className="flex flex-col gap-1">
                  <p className="font-bold text-ink">{t(benefit.title)}</p>
                  <p className="text-caption text-ink-muted">{t(benefit.detail)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {premium ? (
        <>
          <p
            role="status"
            className="flex items-center justify-center gap-2.5 rounded-[16px] bg-safe/12 p-4 font-display text-[1.375rem] font-bold text-safe"
          >
            <SealCheck size={26} weight="fill" aria-hidden="true" />
            {t(p.active)}
          </p>
          <MenuButton to="/premium/guias" variant="blue">
            <BookOpenText {...ICON} />
            {withoutEmoji(t(premiumContent.library.title))}
          </MenuButton>
        </>
      ) : (
        <div className="flex flex-col gap-2">
          <Button variant="blue" disabled>
            {t(p.buy)}
          </Button>
          <p className="text-center text-caption text-ink-muted">{t(newTexts.premium.comingSoon)}</p>
        </div>
      )}

      {!premium && (
        <Button disabled={restoring} onClick={() => void restore()}>
          <ArrowsClockwise {...ICON} />
          {t(p.restore)}
        </Button>
      )}
      <MenuButton to="/" className="mt-auto">
        {t(p.back)}
      </MenuButton>
    </Screen>
  );
}
