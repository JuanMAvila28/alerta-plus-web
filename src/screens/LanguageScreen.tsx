import { uiText } from '../content';
import { Button, MenuButton } from '../components/MenuButton';
import { Screen } from '../components/Screen';
import { useAuth } from '../lib/auth';
import { saveDocument, useDocument } from '../lib/data';
import { useLanguage } from '../lib/i18n';
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
      <h1 className="text-center text-[28px] font-bold">{t(uiText.language.title)}</h1>
      <p className="text-center text-lg">{t(uiText.language.question)}</p>
      {options.map(({ value, label }) => (
        <Button
          key={value}
          variant={language === value ? 'blue' : 'outline'}
          aria-pressed={language === value}
          onClick={() => {
            void setLanguage(value);
            // With an account the language also travels to the user's other devices.
            if (session?.dataConsent && preferences) void saveDocument('preferences', { ...preferences, language: value });
          }}
        >
          {language === value ? `✓ ${label}` : label}
        </Button>
      ))}
      <MenuButton to="/">{t(uiText.language.back)}</MenuButton>
    </Screen>
  );
}
