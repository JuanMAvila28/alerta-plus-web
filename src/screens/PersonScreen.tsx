import { AddressBook, Info, WarningCircle } from '@phosphor-icons/react';
import { useEffect, useId, useState, type InputHTMLAttributes } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { uiText } from '../content';
import { Button, MenuButton } from '../components/MenuButton';
import { Screen, ScreenHeader } from '../components/Screen';
import {
  canPickContact,
  cleanPerson,
  MAX_FIELD,
  MAX_PEOPLE,
  pickContact,
  upsertPerson,
  validatePerson,
  type PersonError,
} from '../lib/contacts';
import { saveDocument, useDocument } from '../lib/data';
import { withoutEmoji } from '../lib/emoji';
import { useLanguage } from '../lib/i18n';
import { getFlag, setFlag } from '../lib/localPreferences';
import { newTexts } from '../newTexts';
import type { Contact } from '../types';

/** /nucleo/persona (add) and /nucleo/persona/:index (edit) (plan section 6.8). */
export default function PersonScreen() {
  const { index: indexParam } = useParams();
  const contacts = useDocument('contacts');
  if (!contacts) return null;

  const index = indexParam === undefined ? undefined : Number(indexParam);
  if (index !== undefined && !(Number.isInteger(index) && index >= 0 && index < contacts.people.length)) {
    return <Navigate to="/nucleo" replace />;
  }
  if (index === undefined && contacts.people.length >= MAX_PEOPLE) return <Navigate to="/nucleo" replace />;
  return <PersonForm people={contacts.people} index={index} />;
}

function Field({ label, ...props }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-bold text-ink">
        {label}
      </label>
      <input
        id={id}
        maxLength={MAX_FIELD}
        className="min-h-14 rounded-[14px] border-2 border-ink/50 bg-page px-4 text-body text-ink transition-colors duration-150 focus:border-alert-blue aria-invalid:border-danger"
        {...props}
      />
    </div>
  );
}

function PersonForm({ people, index }: { people: Contact[]; index?: number }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  // Editing preloads the three fields (fix 9.2).
  const [person, setPerson] = useState<Contact>(
    index === undefined ? { name: '', relationship: '', phone: '' } : people[index]!,
  );
  const [error, setError] = useState<PersonError | null>(null);
  const [showNotice, setShowNotice] = useState(false);
  /** Phone that came from the contact picker (the original app showed it after picking). */
  const [pickedPhone, setPickedPhone] = useState<string | null>(null);
  const p = uiText.person;

  // Third-party consent note, once, when adding the first person (plan section 7.8).
  useEffect(() => {
    if (index !== undefined || people.length > 0) return;
    let active = true;
    void getFlag('thirdPartyNoticeSeen').then((seen) => active && setShowNotice(!seen));
    return () => {
      active = false;
    };
  }, [index, people.length]);

  const update = (changes: Partial<Contact>) => {
    setPerson({ ...person, ...changes });
    setError(null);
  };

  const pick = async () => {
    try {
      const picked = await pickContact();
      if (!picked) return;
      update({ name: picked.name || person.name, phone: picked.phone || person.phone });
      setPickedPhone(picked.phone || null);
    } catch (pickError) {
      console.warn('Contact picker failed.', pickError);
    }
  };

  const save = async () => {
    const problem = validatePerson(person);
    if (problem) {
      setError(problem);
      return;
    }
    await saveDocument('contacts', { people: upsertPerson(people, cleanPerson(person), index) });
    if (showNotice) await setFlag('thirdPartyNoticeSeen', true);
    navigate('/nucleo');
  };

  return (
    <Screen>
      <ScreenHeader title={t(p.title)}>{t(p.description)}</ScreenHeader>

      {showNotice && (
        <p role="note" className="flex items-start gap-3 rounded-[16px] bg-warn/10 p-4 text-ink">
          <Info size={22} weight="bold" aria-hidden="true" className="mt-0.5 shrink-0 text-warn" />
          {t(newTexts.person.thirdPartyNotice)}
        </p>
      )}

      <form
        className="flex flex-col gap-5"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <Field
          label={t(p.name)}
          autoComplete="off"
          value={person.name}
          aria-invalid={error === 'nameRequired'}
          onChange={(event) => update({ name: event.target.value })}
        />
        <div className="flex flex-col gap-3">
          <Field
            label={t(p.phone)}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={person.phone}
            aria-invalid={error === 'phoneRequired' || error === 'phoneInvalid'}
            onChange={(event) => update({ phone: event.target.value })}
          />
          {canPickContact() && (
            <Button onClick={() => void pick()}>
              <AddressBook size={20} weight="bold" aria-hidden="true" />
              {withoutEmoji(t(p.pickContact))}
            </Button>
          )}
          {pickedPhone && pickedPhone === person.phone && (
            <p className="text-caption text-ink-muted">{t(p.selectedPhone, { phone: pickedPhone })}</p>
          )}
        </div>
        <Field
          label={t(p.relationship)}
          autoComplete="off"
          value={person.relationship}
          onChange={(event) => update({ relationship: event.target.value })}
        />

        {error && (
          <p role="alert" className="flex items-start gap-3 rounded-[16px] bg-danger/10 p-4 font-semibold text-danger">
            <WarningCircle size={22} weight="bold" aria-hidden="true" className="mt-0.5 shrink-0" />
            {t(newTexts.person[error])}
          </p>
        )}

        <Button type="submit" variant="blue" className="mt-1">
          {withoutEmoji(t(p.save))}
        </Button>
      </form>
      <MenuButton to="/nucleo">{withoutEmoji(t(newTexts.person.back))}</MenuButton>
    </Screen>
  );
}
