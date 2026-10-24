import { useState } from 'react';
import { useNavigate } from 'react-router';
import { homeContent } from '../content';
import { Button, MenuButton } from '../components/MenuButton';
import { Screen } from '../components/Screen';
import { SegmentedControl } from '../components/SegmentedControl';
import { saveDocument, useDocument } from '../lib/data';
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
      <h1 className="text-center text-[28px] font-bold">{t(homeContent.title)}</h1>
      <p className="text-center text-lg">{t(homeContent.description)}</p>

      {homeContent.fields.map((field) => (
        <SegmentedControl
          key={field.key}
          label={t(field.label)}
          options={field.options.map((option) => ({ value: option.value, label: t(option.label) }))}
          value={home[field.key]}
          onChange={(value) => setHome({ ...home, [field.key]: value })}
        />
      ))}

      <Button variant="blue" onClick={() => void save()}>
        {t(homeContent.saveButton)}
      </Button>
      <MenuButton to="/">{t(homeContent.backButton)}</MenuButton>
    </Screen>
  );
}
