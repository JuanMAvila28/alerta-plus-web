import { PaperPlaneTilt, PencilSimple, Phone, Plus, Trash, UsersThree } from '@phosphor-icons/react';
import { uiText } from '../content';
import { Button, MenuButton } from '../components/MenuButton';
import { HeaderIcon, Screen, ScreenHeader } from '../components/Screen';
import { MAX_PEOPLE, removePerson } from '../lib/contacts';
import { saveDocument, useDocument } from '../lib/data';
import { withoutEmoji } from '../lib/emoji';
import { useLanguage } from '../lib/i18n';
import { newTexts } from '../newTexts';

const ICON = { size: 20, weight: 'bold', 'aria-hidden': true } as const;

/** /nucleo (plan section 6.8). */
export default function ContactsScreen() {
  const { t } = useLanguage();
  const contacts = useDocument('contacts');
  if (!contacts) return null;
  const { people } = contacts;
  const c = uiText.contacts;

  return (
    <Screen>
      <ScreenHeader
        title={t(c.title)}
        subtitle={t(c.subtitle)}
        icon={
          <HeaderIcon className="bg-safe/15 text-safe">
            <UsersThree size={28} weight="bold" aria-hidden="true" />
          </HeaderIcon>
        }
      >
        {t(c.description)}
      </ScreenHeader>

      {people.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-[1.375rem] leading-tight font-bold text-ink">{withoutEmoji(t(c.myContacts))}</h2>
          <ul className="flex flex-col gap-3">
            {people.map((person, index) => (
              <li key={index} className="flex flex-col gap-4 rounded-[20px] bg-surface p-4">
                <div className="flex items-center gap-3.5">
                  <span
                    aria-hidden="true"
                    className="flex size-12 shrink-0 items-center justify-center rounded-full bg-alert-blue font-display text-[1.375rem] font-bold text-white"
                  >
                    {person.name.trim().charAt(0).toUpperCase()}
                  </span>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <p className="text-[1.125rem] font-bold [overflow-wrap:anywhere] text-ink">{person.name}</p>
                    {person.relationship && (
                      <p className="text-caption text-ink-muted">{t(c.relationship, { relationship: person.relationship })}</p>
                    )}
                    <p className="flex items-center gap-1.5 text-caption text-ink-muted">
                      <Phone size={16} weight="bold" aria-hidden="true" className="shrink-0" />
                      {person.phone}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2.5 min-[360px]:grid-cols-2">
                  <MenuButton to={`/nucleo/persona/${index}`}>
                    <PencilSimple {...ICON} />
                    {withoutEmoji(t(c.edit))}
                  </MenuButton>
                  {/* Deleting saves right away (fix 9.1). */}
                  <Button
                    variant="danger"
                    onClick={() => void saveDocument('contacts', { people: removePerson(people, index) })}
                  >
                    <Trash {...ICON} />
                    {withoutEmoji(t(c.delete))}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {people.length < MAX_PEOPLE ? (
        <MenuButton to="/nucleo/persona" variant="blue">
          <Plus {...ICON} />
          {withoutEmoji(t(c.add))}
        </MenuButton>
      ) : (
        <p className="text-center text-caption text-ink-muted">{t(newTexts.contacts.limitReached)}</p>
      )}
      <MenuButton to="/nucleo/avisar">
        <PaperPlaneTilt {...ICON} />
        {withoutEmoji(t(c.notify))}
      </MenuButton>
      <MenuButton to="/" className="mt-auto">
        {withoutEmoji(t(c.backToMenu))}
      </MenuButton>
    </Screen>
  );
}
