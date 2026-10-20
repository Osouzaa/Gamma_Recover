import { useId, useRef, useState } from 'react';
import { Info } from 'lucide-react';
import { Bubble, Trigger, Wrapper } from './styles';
export function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const id = useId();
  const ref = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 12, top: 0 });
  const show = () => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      setPosition({
        left: Math.max(12, Math.min(rect.right - 260, window.innerWidth - 272)),
        top: rect.bottom + 8,
      });
      setOpen(true);
    }
  };
  return (
    <Wrapper onMouseEnter={show} onMouseLeave={() => setOpen(false)}>
      <Trigger
        ref={ref}
        type="button"
        aria-label={`Sobre ${label}`}
        aria-describedby={open ? id : undefined}
        onFocus={show}
        onBlur={() => setOpen(false)}
        onClick={show}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false);
        }}
      >
        <Info size={13} />
      </Trigger>
      {open && (
        <Bubble id={id} role="tooltip" $left={position.left} $top={position.top}>
          {children}
        </Bubble>
      )}
    </Wrapper>
  );
}
