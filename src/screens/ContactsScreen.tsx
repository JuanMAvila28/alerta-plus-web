import { uiText } from '../content';
import { Button, MenuButton } from '../components/MenuButton';
import { Screen } from '../components/Screen';
import { MAX_PEOPLE, removePerson } from '../lib/contacts';
import { saveDocument, useDocument } from '../lib/data';
import { useLanguage } from '../lib/i18n';
import { newTexts } from '../newTexts';

/** /nucleo (plan section 6.8). */
export default function ContactsScreen() {
  const { t } = useLanguage();
  const contacts = useDocument('contacts');
  if (!contacts) return null;
  const { people } = contacts;
  const c = uiText.contacts;

  return (
    <Screen>
      <h1 className="text-center text-[28px] font-bold">{t(c.title)}</h1>
      <h2 className="text-center text-xl font-bold text-alert-blue">{t(c.subtitle)}</h2>
      <p className="text-center text-lg">{t(c.description)}</p>

      <h2 className="mt-2 text-xl font-bold">{t(c.myContacts)}</h2>
      <ul className="flex flex-col gap-3">
        {people.map((person, index) => (
          <li key={index} className="flex flex-col gap-2 rounded-xl bg-premium-card p-4">
            <p className="text-lg font-bold">👤 {person.name}</p>
            {person.relationship && <p className="text-base">{t(c.relationship, { relationship: person.relationship })}</p>}
            <p className="text-base">📱 {person.phone}</p>
            <div className="flex gap-2">
              {/* Deleting saves right away (fix 9.1). */}
              <Button onClick={() => void saveDocument('contacts', { people: removePerson(people, index) })}>
                {t(c.delete)}
              </Button>
              <MenuButton to={`/nucleo/persona/${index}`}>{t(c.edit)}</MenuButton>
            </div>
          </li>
        ))}
      </ul>

      {people.length < MAX_PEOPLE ? (
        <MenuButton to="/nucleo/persona">{t(c.add)}</MenuButton>
      ) : (
        <p className="text-center text-base text-slate-700">{t(newTexts.contacts.limitReached)}</p>
      )}
      <MenuButton to="/nucleo/avisar">{t(c.notify)}</MenuButton>
      <MenuButton to="/">{t(c.backToMenu)}</MenuButton>
    </Screen>
  );
}
