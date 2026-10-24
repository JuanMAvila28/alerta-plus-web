import { listsContent, uiText } from '../content';
import { saveDocument, useDocument } from '../lib/data';
import { useLanguage } from '../lib/i18n';
import type { ListType } from '../types';
import { MenuButton } from './MenuButton';
import { Screen } from './Screen';

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
  const done = list.items.filter((item) => checked.has(item.id)).length;

  return (
    <Screen>
      <h1 className="text-center text-[28px] font-bold">{t(list.title)}</h1>
      <p className="text-center text-lg">{t(list.description)}</p>

      <ul className="flex flex-col gap-3">
        {list.items.map((item) => {
          const isChecked = checked.has(item.id);
          return (
            <li key={item.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={isChecked}
                onClick={() => toggle(item.id)}
                className={`flex min-h-[52px] w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-lg font-semibold transition ${
                  isChecked ? 'border-alert-blue bg-blue-50 text-slate-900' : 'border-slate-300 bg-white text-slate-900'
                }`}
              >
                <span aria-hidden="true" className="text-2xl">
                  {isChecked ? '☑' : '☐'}
                </span>
                <span>{t(item.text)}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <p role="status" className="text-center text-lg font-bold">
        {t(uiText.lists.readyCount, { done, total: list.items.length })}
      </p>
      <MenuButton to="/">{t(uiText.lists.backToMenu)}</MenuButton>
    </Screen>
  );
}
