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
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-base font-bold">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex min-h-12 flex-1 cursor-pointer items-center justify-center rounded-xl border-2 border-alert-blue px-3 py-2 text-center text-base font-semibold text-alert-blue transition has-checked:bg-alert-blue has-checked:text-white has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-alert-blue"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
