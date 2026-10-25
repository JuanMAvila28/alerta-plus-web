import { useState } from 'react';
import { useNavigate } from 'react-router';
import { homeContent } from '../content';
import { Button, MenuButton } from '../components/MenuButton';
import { Screen, ScreenHeader } from '../components/Screen';
import { SegmentedControl } from '../components/SegmentedControl';
import { saveDocument, useDocument } from '../lib/data';
import { withoutEmoji } from '../lib/emoji';
import { useLanguage } from '../lib/i18n';
import type { Home } from '../types';

/** /vivienda (plan section 6.5). */
export default function HomeScreen() {
  const saved = useDocument('home');
  // Wait for the saved home so the form starts with it, not with the defaults.
  return saved ? <HomeForm saved={saved} /> : null;
}

function HomeForm({ saved }: { saved: Home }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [home, setHome] = useState<Home>(saved);

  const save = async () => {
    await saveDocument('home', home);
    navigate('/');
  };

  return (
    <Screen>
      <ScreenHeader title={t(homeContent.title)}>{t(homeContent.description)}</ScreenHeader>

      <div className="flex flex-col gap-6">
        {homeContent.fields.map((field) => (
          <SegmentedControl
            key={field.key}
            label={t(field.label)}
            options={field.options.map((option) => ({ value: option.value, label: t(option.label) }))}
            value={home[field.key]}
            onChange={(value) => setHome({ ...home, [field.key]: value })}
          />
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <Button variant="blue" onClick={() => void save()}>
          {t(homeContent.saveButton)}
        </Button>
        <MenuButton to="/">{withoutEmoji(t(homeContent.backButton))}</MenuButton>
      </div>
    </Screen>
  );
}
