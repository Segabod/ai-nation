"use client";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "@/src/lib/forms";

export type Field = {
  name: string;
  label?: string;
  type?: "text" | "email" | "password" | "url" | "textarea" | "select" | "checkbox" | "hidden" | "roles";
  options?: { value: string; label: string; hint?: string }[];
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
  help?: string;
  autoComplete?: string;
  maxLength?: number;
  half?: boolean;
};

type Props = {
  action: (s: FormState, fd: FormData) => Promise<FormState>;
  fields: Field[];
  submit: string;
  variant?: "primary" | "blue" | "light";
  resetOnSuccess?: boolean;
  footer?: React.ReactNode;
};

function Submit({ label, variant }: { label: string; variant: string }) {
  const { pending } = useFormStatus();
  return (
    <button className={`btn btn-${variant}`} type="submit" disabled={pending} style={{ justifySelf: "start" }}>
      {pending ? "Working…" : label} <span className="ar" aria-hidden>↗</span>
    </button>
  );
}

export default function SmartForm({ action, fields, submit, variant = "primary", resetOnSuccess, footer }: Props) {
  const [state, formAction] = useActionState(action, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);

  const val = (f: Field) => state.values?.[f.name] ?? f.defaultValue ?? "";
  // key forces inputs to pick up returned values after a failed submit
  const k = JSON.stringify(state.values ?? {}) + (state.ok ?? "");

  const render = (f: Field) => {
    const id = `f-${f.name}`;
    const common = { id, name: f.name, required: f.required, placeholder: f.placeholder, maxLength: f.maxLength };
    switch (f.type) {
      case "hidden":
        return <input key={f.name} type="hidden" name={f.name} value={f.defaultValue ?? ""} />;
      case "textarea":
        return wrap(f, id, <textarea className="textarea" {...common} defaultValue={val(f)} key={k} />);
      case "select":
        return wrap(
          f, id,
          <select className="select" {...common} defaultValue={val(f)} key={k}>
            {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>,
        );
      case "checkbox":
        return (
          <label key={f.name} className="check">
            <input type="checkbox" name={f.name} defaultChecked={val(f) === "on" || val(f) === "true"} required={f.required} />
            <span>{f.label}</span>
          </label>
        );
      case "roles":
        return (
          <fieldset key={f.name} className="field" style={{ border: 0, padding: 0, margin: 0 }}>
            <legend style={{ fontSize: 13.5, color: "var(--muted)", marginBottom: 6 }}>{f.label}</legend>
            <div className="role-pick">
              {f.options?.map((o) => (
                <label key={o.value}>
                  <input type="radio" name={f.name} value={o.value} defaultChecked={val(f) === o.value} required />
                  <b>{o.label}</b>
                  <span>{o.hint}</span>
                </label>
              ))}
            </div>
          </fieldset>
        );
      default:
        return wrap(f, id, <input className="input" type={f.type ?? "text"} autoComplete={f.autoComplete} {...common} defaultValue={val(f)} key={k} />);
    }
  };

  const items: React.ReactNode[] = [];
  for (let i = 0; i < fields.length; i++) {
    const f = fields[i];
    if (f.half && fields[i + 1]?.half) {
      items.push(<div key={`pair-${f.name}`} className="grid-2">{render(f)}{render(fields[i + 1])}</div>);
      i++;
    } else items.push(render(f));
  }

  return (
    <form ref={ref} action={formAction} className="form" noValidate={false}>
      {state.error && <div className="notice err" role="alert">{state.error}</div>}
      {state.ok && <div className="notice ok" role="status">{state.ok}</div>}
      {items}
      <Submit label={submit} variant={variant} />
      {footer}
    </form>
  );
}

function wrap(f: Field, id: string, el: React.ReactNode) {
  return (
    <div className="field" key={f.name}>
      {f.label && <label htmlFor={id}>{f.label}{f.required ? "" : " (optional)"}</label>}
      {el}
      {f.help && <small>{f.help}</small>}
    </div>
  );
}
