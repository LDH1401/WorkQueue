import { useCallback, useEffect, useId, useRef, useState } from 'react';
import Icon from './icons';

export default function Select({
  value,
  onChange,
  options = [],
  placeholder = 'Chọn...',
  disabled = false,
  ariaLabel,
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const typed = useRef({ text: '', at: 0 });
  const listId = `sel-${useId().replace(/:/g, '')}`;

  const index = options.findIndex((o) => String(o.value) === String(value));
  const selected = index >= 0 ? options[index] : null;

  const place = useCallback(() => {
    const el = btnRef.current;
    if (!el) return;

    const r = el.getBoundingClientRect();
    const gap = 6;
    const below = window.innerHeight - r.bottom - gap - 8;
    const above = r.top - gap - 8;
    const flip = below < 180 && above > below;

    setPos({
      left: r.left,
      width: r.width,
      ...(flip ? { bottom: window.innerHeight - r.top + gap } : { top: r.bottom + gap }),
      maxHeight: Math.max(120, Math.min(280, flip ? above : below)),
    });
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    place();
    const onScroll = () => place();
    const onDown = (e) => {
      if (!btnRef.current?.contains(e.target) && !e.target.closest(`#${listId}`)) setOpen(false);
    };

    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    document.addEventListener('mousedown', onDown);

    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
      document.removeEventListener('mousedown', onDown);
    };
  }, [open, place, listId]);

  useEffect(() => {
    if (open) setActive(Math.max(0, index));
  }, [open, index]);

  useEffect(() => {
    if (open) document.querySelector(`#${listId} [data-active="true"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open, listId]);

  const pick = (option) => {
    onChange(option.value);
    setOpen(false);
    btnRef.current?.focus();
  };

  const onKeyDown = (e) => {
    if (disabled) return;

    if (!open) {
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % options.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i - 1 + options.length) % options.length);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActive(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActive(options.length - 1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (options[active]) pick(options[active]);
    } else if (e.key === 'Tab') {
      setOpen(false);
    } else if (e.key.length === 1) {
      const now = Date.now();
      typed.current = {
        text: now - typed.current.at > 900 ? e.key : typed.current.text + e.key,
        at: now,
      };
      const q = typed.current.text.toLowerCase();
      const found = options.findIndex((o) => o.label.toLowerCase().startsWith(q));
      if (found >= 0) setActive(found);
    }
  };

  return (
    <>
      <button
        type="button"
        ref={btnRef}
        className={`select ${className}${open ? ' select--open' : ''}`}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={onKeyDown}
        disabled={disabled}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
      >
        {selected?.color && <i className="dot" style={{ background: selected.color }} />}
        <span className={selected ? 'select__text' : 'select__placeholder'}>{selected ? selected.label : placeholder}</span>
        <Icon name="chevronDown" className="select__caret" />
      </button>

      {open && pos && (
        <div
          id={listId}
          className="select__menu"
          role="listbox"
          style={{
            left: pos.left,
            minWidth: pos.width,
            top: pos.top,
            bottom: pos.bottom,
            maxHeight: pos.maxHeight,
          }}
        >
          {options.map((o, i) => {
            const isSelected = String(o.value) === String(value);
            return (
              <button
                key={String(o.value)}
                type="button"
                role="option"
                aria-selected={isSelected}
                data-active={i === active}
                className={`select__option${isSelected ? ' select__option--selected' : ''}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(o)}
              >
                {o.color && <i className="dot" style={{ background: o.color }} />}
                <span>{o.label}</span>
                {isSelected && <Icon name="check" className="select__check" size={14} />}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
