"use client";
import { useId, useMemo, useRef, useState } from "react";

type Props = {
  id: string;
  name: string;
  options: string[];
  defaultValue?: string;
  required?: boolean;
  placeholder?: string;
  maxLength?: number;
};

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** A text box that suggests matches as you type, but accepts any value. Follows the ARIA combobox pattern. */
export default function ComboInput({ id, name, options, defaultValue = "", required, placeholder, maxLength }: Props) {
  const listId = useId();
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const input = useRef<HTMLInputElement>(null);

  const matches = useMemo(() => {
    const q = norm(value.trim());
    if (!q) return [];
    const starts: string[] = [], contains: string[] = [];
    for (const o of options) {
      const n = norm(o);
      if (n === q) continue; // already typed in full
      if (n.startsWith(q) || n.split(/[\s(]+/).some((w) => w.startsWith(q))) starts.push(o);
      else if (n.includes(q)) contains.push(o);
    }
    return [...starts, ...contains].slice(0, 8);
  }, [value, options]);

  const show = open && matches.length > 0;
  const pick = (v: string) => {
    setValue(v);
    setOpen(false);
    setActive(-1);
    input.current?.focus();
  };

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (matches.length ? (a + 1) % matches.length : -1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (matches.length ? (a <= 0 ? matches.length - 1 : a - 1) : -1));
    } else if (e.key === "Enter" && show && active >= 0) {
      e.preventDefault(); // choose the suggestion instead of submitting the form
      pick(matches[active]);
    } else if (e.key === "Escape" && show) {
      e.preventDefault();
      setOpen(false);
    }
  }

  // highlight the typed part of each suggestion
  const mark = (o: string) => {
    const i = norm(o).indexOf(norm(value.trim()));
    if (i < 0) return o;
    const j = i + value.trim().length;
    return <>{o.slice(0, i)}<b>{o.slice(i, j)}</b>{o.slice(j)}</>;
  };

  return (
    <div className="combo">
      <input
        ref={input}
        id={id}
        name={name}
        className="input"
        type="text"
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={show}
        aria-controls={listId}
        aria-activedescendant={show && active >= 0 ? `${listId}-${active}` : undefined}
        value={value}
        required={required}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(e) => { setValue(e.target.value); setOpen(true); setActive(-1); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={onKeyDown}
      />
      {show && (
        <ul id={listId} role="listbox" className="combo-list">
          {matches.map((m, i) => (
            <li
              key={m}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              className={i === active ? "on" : ""}
              onMouseDown={(e) => { e.preventDefault(); pick(m); }}
              onMouseEnter={() => setActive(i)}
            >
              {mark(m)}
            </li>
          ))}
          <li className="combo-hint" aria-hidden>Not listed? Just keep typing.</li>
        </ul>
      )}
    </div>
  );
}
