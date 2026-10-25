import { Check } from '@phosphor-icons/react';
import { useId } from 'react';

interface Option {
  value: string;
  label: string;
}

/** All options visible; one chosen (plan section 6.5). Native radios, so keyboard and screen readers work. */
export function SegmentedControl({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
}) {
  const name = useId();
  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className="mb-2.5 font-display text-[1.25rem] leading-tight font-semibold tracking-[0.01em] text-ink">
        {label}
      </legend>
      <div className="flex flex-wrap gap-1.5 rounded-[16px] bg-surface p-1.5">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex min-h-12 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[11px] px-3 py-2 text-center font-bold text-ink transition-colors duration-150 hover:bg-surface-pressed has-checked:bg-alert-blue has-checked:text-white has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />
            {/* The check repeats the choice, so it never depends on color alone. */}
            <Check size={16} weight="bold" aria-hidden="true" className="hidden shrink-0 peer-checked:block" />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
