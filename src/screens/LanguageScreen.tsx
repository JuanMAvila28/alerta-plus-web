import { Check } from '@phosphor-icons/react';
import { uiText } from '../content';
import { MenuButton } from '../components/MenuButton';
import { Screen, ScreenHeader } from '../components/Screen';
import { useAuth } from '../lib/auth';
import { saveDocument, useDocument } from '../lib/data';
import { HTML_LANG, useLanguage } from '../lib/i18n';
import type { Language } from '../types';

export default function LanguageScreen() {
  const { language, t, setLanguage } = useLanguage();
  const { session } = useAuth();
  const preferences = useDocument('preferences');
  const options: { value: Language; label: string }[] = [
    { value: 'es', label: t(uiText.language.spanish) },
    { value: 'en', label: t(uiText.language.english) },
  ];

  return (
    <Screen>
      <ScreenHeader title={t(uiText.language.title)}>{t(uiText.language.question)}</ScreenHeader>

      <div className="flex flex-col gap-3">
        {options.map(({ value, label }) => {
          const selected = language === value;
          return (
            <button
              key={value}
              type="button"
              lang={HTML_LANG[value]}
              aria-pressed={selected}
              className={`flex min-h-[4.5rem] cursor-pointer items-center gap-4 rounded-[18px] border-2 px-5 text-left transition-colors duration-150 ${
                selected ? 'border-alert-blue bg-alert-blue/8' : 'border-line hover:bg-surface active:bg-surface-pressed'
              }`}
              onClick={() => {
                void setLanguage(value);
                // With an account the language also travels to the user's other devices.
                if (session?.dataConsent && preferences) void saveDocument('preferences', { ...preferences, language: value });
              }}
            >
              <span className="flex-1 font-display text-[1.625rem] font-bold text-ink">{label}</span>
              <span
                aria-hidden="true"
                className={`flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-150 ${
                  selected ? 'border-alert-blue bg-alert-blue text-white' : 'border-ink/50'
                }`}
              >
                {selected && <Check size={18} weight="bold" />}
              </span>
            </button>
          );
        })}
      </div>

      <MenuButton to="/" className="mt-auto">
        {t(uiText.language.back)}
      </MenuButton>
    </Screen>
  );
}
