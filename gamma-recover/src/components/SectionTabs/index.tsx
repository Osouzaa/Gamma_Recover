import { useRef } from 'react';
import { TabList } from './styles';
export function SectionTabs({
  label,
  options,
  value,
  onChange,
  panelId,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  panelId: string;
}) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  return (
    <TabList role="tablist" aria-label={label}>
      {options.map((option, i) => (
        <button
          key={option}
          ref={(node) => {
            buttons.current[i] = node;
          }}
          role="tab"
          aria-selected={value === option}
          aria-controls={panelId}
          tabIndex={value === option ? 0 : -1}
          onClick={() => onChange(option)}
          onKeyDown={(e) => {
            let next = i;
            if (e.key === 'ArrowRight') next = (i + 1) % options.length;
            else if (e.key === 'ArrowLeft') next = (i - 1 + options.length) % options.length;
            else if (e.key === 'Home') next = 0;
            else if (e.key === 'End') next = options.length - 1;
            else return;
            e.preventDefault();
            onChange(options[next]);
            buttons.current[next]?.focus();
          }}
        >
          {option}
        </button>
      ))}
    </TabList>
  );
}
