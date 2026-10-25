import { Check } from '@phosphor-icons/react';
import { listsContent, uiText } from '../content';
import { saveDocument, useDocument } from '../lib/data';
import { withoutEmoji } from '../lib/emoji';
import { useLanguage } from '../lib/i18n';
import type { ListType } from '../types';
import { MenuButton } from './MenuButton';
import { Screen, ScreenHeader } from './Screen';

/** Kit, first aid kit and checklist (plan section 6.7). Saved by item `id`, on every tap. */
export function CheckList({ type }: { type: ListType }) {
  const { t } = useLanguage();
  const list = listsContent[type];
  const saved = useDocument(type);
  if (!saved) return null;

  const checked = new Set(saved.checked);
  const toggle = (id: string) => {
    const next = new Set(checked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    // Keep the JSON order so the saved document does not depend on the tapping order.
    void saveDocument(type, { checked: list.items.map((item) => item.id).filter((itemId) => next.has(itemId)) });
  };
  const total = list.items.length;
  const done = list.items.filter((item) => checked.has(item.id)).length;

  return (
    <Screen>
      <ScreenHeader title={withoutEmoji(t(list.title))}>{t(list.description)}</ScreenHeader>

      <section className="flex flex-col gap-3 rounded-[20px] bg-surface p-4">
        <p role="status" className="font-display text-[1.375rem] leading-none font-bold text-ink">
          {t(uiText.lists.readyCount, { done, total })}
        </p>
        <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-line">
          <div
            className="h-full origin-left rounded-full bg-safe transition-transform duration-300 ease-out-quart"
            style={{ transform: `scaleX(${done / total})` }}
          />
        </div>
      </section>

      <ul className="overflow-hidden rounded-[20px] bg-surface">
        {list.items.map((item) => {
          const isChecked = checked.has(item.id);
          return (
            <li key={item.id} className="group/item">
              <button
                type="button"
                role="checkbox"
                aria-checked={isChecked}
                onClick={() => toggle(item.id)}
                className="flex w-full cursor-pointer items-center gap-4 pl-4 text-left transition-colors duration-150 hover:bg-surface-pressed active:bg-surface-pressed"
              >
                {/* Green = ready (ISO safe condition); the check mark repeats it without color. */}
                <span
                  aria-hidden="true"
                  className={`flex size-7 shrink-0 items-center justify-center rounded-[8px] border-2 transition-colors duration-150 ${
                    isChecked ? 'border-safe bg-safe text-page' : 'border-ink/50 bg-page'
                  }`}
                >
                  {isChecked && <Check size={18} weight="bold" />}
                </span>
                <span
                  className={`flex min-h-16 flex-1 items-center self-stretch border-b border-line py-3 pr-4 group-last/item:border-b-0 ${
                    isChecked ? 'text-ink-muted' : 'text-ink'
                  }`}
                >
                  {withoutEmoji(t(item.text))}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <MenuButton to="/" className="mt-2">
        {withoutEmoji(t(uiText.lists.backToMenu))}
      </MenuButton>
    </Screen>
  );
}
