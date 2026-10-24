import type { ComponentType } from 'react';
import { Link } from 'react-router';
import { uiText } from '../content';
import { useLanguage } from '../lib/i18n';
import type { LocalizedText } from '../types';
import { BeaconPictogram, EarthquakePictogram } from './Pictogram';

interface Sign {
  to: string;
  label: LocalizedText;
  Pictogram: ComponentType<{ className?: string }>;
  color: string;
  /** Full size: the earthquake sign is the tallest, as the red button was in the Android app. */
  large: string;
}

const SIGNS: Sign[] = [
  {
    to: '/sismo',
    label: uiText.menu.earthquake,
    Pictogram: EarthquakePictogram,
    color: 'bg-alert-red shadow-alert-red/30 hover:bg-alert-red-deep',
    large: 'min-h-[6.75rem] text-[2rem]',
  },
  {
    to: '/emergencia',
    label: uiText.menu.emergency,
    Pictogram: BeaconPictogram,
    color: 'bg-alert-blue shadow-alert-blue/30 hover:bg-alert-blue-deep',
    large: 'min-h-[5.75rem] text-[1.75rem]',
  },
];

/**
 * The two emergency entry points, drawn as safety signs: white keyline, pictogram panel, text panel.
 * `compact` is for screens where they are the way out (e.g. /login), not the main content.
 */
export function EmergencySigns({ compact = false }: { compact?: boolean }) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col gap-3">
      {SIGNS.map(({ to, label, Pictogram, color, large }) => (
        <Link
          key={to}
          to={to}
          className={`block rounded-[18px] p-[5px] text-white shadow-lg transition-[background-color,scale] duration-150 ease-out-quart active:scale-[0.98] ${color}`}
        >
          <span
            className={`flex h-full items-stretch rounded-[13px] border-2 border-white/90 ${compact ? 'min-h-[4.5rem] text-[1.5rem]' : large}`}
          >
            <span className={`flex shrink-0 items-center justify-center border-r-2 border-white/90 ${compact ? 'w-16' : 'w-[4.75rem]'}`}>
              <Pictogram className={compact ? 'size-9' : 'size-12'} />
            </span>
            <span className="flex flex-1 items-center px-4 py-2.5 font-display leading-[0.95] font-bold tracking-[0.01em]">
              {t(label)}
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}
