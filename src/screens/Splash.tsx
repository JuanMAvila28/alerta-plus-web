import { useEffect } from 'react';
import { uiText } from '../content';
import { useLanguage } from '../lib/i18n';

const DURATION_MS = 1500;

export default function Splash({ onDone }: { onDone: () => void }) {
  const { t } = useLanguage();

  useEffect(() => {
    const timer = setTimeout(onDone, DURATION_MS);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-splash px-6 text-center">
      <img src="/logo.svg" alt="" width={144} height={144} />
      <h1 className="text-[30px] font-bold text-white">{t(uiText.app.name)}</h1>
      <p className="text-base text-splash-text">{t(uiText.app.splashTagline)}</p>
    </div>
  );
}
