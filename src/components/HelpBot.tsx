"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useEffect, useRef, useState } from "react";
import { SUGGESTIONS } from "@/src/lib/help";

type Msg = { role: "user" | "assistant"; content: string };
type Props = { user: { name: string; role: string } | null };

const STORE = "ain_help_v1";

/** Renders the assistant's light markdown: [text](/path) links, **bold**, and line breaks. Internal links only. */
function Rich({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, li) => {
        const parts: React.ReactNode[] = [];
        const re = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*/g;
        let last = 0;
        let m: RegExpExecArray | null;
        let k = 0;
        while ((m = re.exec(line))) {
          if (m.index > last) parts.push(line.slice(last, m.index));
          if (m[1]) {
            const href = m[2];
            parts.push(
              href.startsWith("/") && !href.startsWith("//")
                ? <Link key={k++} href={href} className="hb-link">{m[1]}</Link>
                : <span key={k++}>{m[1]}</span>,
            );
          } else parts.push(<strong key={k++}>{m[3]}</strong>);
          last = m.index + m[0].length;
        }
        if (last < line.length) parts.push(line.slice(last));
        return <Fragment key={li}>{parts}{li < lines.length - 1 && <br />}</Fragment>;
      })}
    </>
  );
}

export default function HelpBot({ user }: Props) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const first = user?.name.split(" ")[0];
  const suggestions = SUGGESTIONS[user?.role ?? "GUEST"] ?? SUGGESTIONS.GUEST;

  // restore conversation for this tab
  useEffect(() => {
    try { const s = sessionStorage.getItem(STORE); if (s) setMsgs(JSON.parse(s)); } catch { /* storage unavailable */ }
  }, []);
  useEffect(() => {
    try { sessionStorage.setItem(STORE, JSON.stringify(msgs.slice(-20))); } catch { /* ignore */ }
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && open) { setOpen(false); btnRef.current?.focus(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: q.slice(0, 1200) }];
    setMsgs([...next, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch("/api/help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-12), page: path }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) throw new Error(String(res.status));
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMsgs([...next, { role: "assistant", content: acc }]);
      }
      if (!acc) setMsgs([...next, { role: "assistant", content: "Sorry, I couldn't come up with an answer. Try rephrasing, or reach the team through [Contact](/contact)." }]);
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setMsgs([...next, { role: "assistant", content: "I'm having trouble connecting right now. Please try again, or reach the team through [Contact](/contact)." }]);
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  function reset() {
    abortRef.current?.abort();
    setMsgs([]);
    setBusy(false);
  }

  return (
    <>
      <button
        ref={btnRef}
        className={`hb-fab ${open ? "is-open" : ""}`}
        aria-expanded={open}
        aria-controls="help-panel"
        aria-label={open ? "Close help" : "Open help assistant"}
        onClick={() => setOpen(!open)}
      >
        {open ? <span aria-hidden>✕</span> : (<><span className="hb-dot" aria-hidden /> Need help?</>)}
      </button>

      {open && (
        <section id="help-panel" className="hb-panel" role="dialog" aria-label="AI Nation help assistant">
          <header className="hb-head">
            <div className="row" style={{ gap: 10 }}>
              <span className="hb-avatar" aria-hidden>ai</span>
              <div>
                <b>Nation Guide</b>
                <span className="hb-sub">AI help for AI Nation</span>
              </div>
            </div>
            <div className="row" style={{ gap: 4 }}>
              {msgs.length > 0 && <button className="hb-icon" onClick={reset} title="Start over" aria-label="Start a new conversation">↺</button>}
              <button className="hb-icon" onClick={() => setOpen(false)} aria-label="Close help">✕</button>
            </div>
          </header>

          <div className="hb-list" ref={listRef} aria-live="polite">
            <div className="hb-msg bot">
              <Rich text={`Hi${first ? ` ${first}` : ""}! I can help you find your way around AI Nation: accounts, the Skills Passport, briefs, Open House and partnerships. What would you like to do?`} />
            </div>
            {msgs.length === 0 && (
              <div className="hb-chips">
                {suggestions.map((s) => <button key={s} className="hb-chip" onClick={() => send(s)}>{s}</button>)}
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={`hb-msg ${m.role === "user" ? "me" : "bot"}`}>
                {m.content ? <Rich text={m.content} /> : <span className="hb-typing" aria-label="Thinking"><i /><i /><i /></span>}
              </div>
            ))}
          </div>

          <form className="hb-form" onSubmit={(e) => { e.preventDefault(); send(input); }}>
            <label htmlFor="hb-input" className="sr-only">Ask a question</label>
            <textarea
              id="hb-input"
              ref={inputRef}
              rows={1}
              maxLength={1200}
              placeholder="Ask a question…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            />
            <button className="hb-send" disabled={busy || !input.trim()} aria-label="Send">↑</button>
          </form>
          <p className="hb-foot">
            AI answers can be wrong. Questions are saved to improve help. <Link href="/contact" className="hb-link">Talk to a person</Link>
          </p>
        </section>
      )}
    </>
  );
}
