"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SHOWCASE } from "@/src/lib/constants";

export function BriefShowcase() {
  const [i, setI] = useState(0);
  const d = SHOWCASE[i];
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const n = (i + (e.key === "ArrowRight" ? 1 : SHOWCASE.length - 1)) % SHOWCASE.length;
    setI(n);
    tabs.current[n]?.focus();
  };
  return (
    <>
      <div className="tabs" role="tablist" aria-label="Illustrative briefs" onKeyDown={onKey}>
        {SHOWCASE.map((s, k) => (
          <button
            key={s.key} ref={(el) => { tabs.current[k] = el; }} className="tab" role="tab"
            id={`t${k}`} aria-selected={k === i} aria-controls="briefPanel" tabIndex={k === i ? 0 : -1}
            onClick={() => setI(k)}
          >
            {s.key}
          </button>
        ))}
      </div>
      <div className="showcase" id="briefPanel" role="tabpanel" aria-labelledby={`t${i}`}>
        <div className="desk" key={d.key}>
          <div className="desk-top"><span>{d.desk}</span><span>DEMO</span></div>
          <h4>{d.head[0]}<br />{d.head[1]}</h4>
          <ol>
            {d.steps.map((s, k) => (<li key={s}><span>{s}</span><b>0{k + 1}</b></li>))}
          </ol>
          <p className="ov">HUMAN OVERSIGHT, BY DESIGN.</p>
        </div>
        <article className="brief-copy">
          <p className="eyebrow o">{d.tag}</p>
          <h3>{d.h}</h3>
          <p className="muted">{d.b}</p>
          <Link href={`/briefs/new?sector=${encodeURIComponent(d.key)}`} className="btn btn-primary">
            Shape a project like this <span className="ar">↗</span>
          </Link>
          <p className="dim" style={{ fontSize: 13 }}>
            Illustrative concepts, not client case studies. Scope, data access and success criteria are agreed before delivery.
          </p>
        </article>
      </div>
    </>
  );
}

const ANSWER =
  "I found that retrieval was returning similar but outdated policies. I added document dates, tested against known questions and introduced a review step for conflicting sources.";

export function TypedSession() {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setN(ANSWER.length); return; }
    let timer: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !timer) {
        timer = setInterval(() => setN((x) => { if (x >= ANSWER.length) { clearInterval(timer); return x; } return x + 1; }), 22);
      }
    }, { threshold: 0.4 });
    if (ref.current) io.observe(ref.current);
    return () => { io.disconnect(); if (timer) clearInterval(timer); };
  }, []);
  return (
    <div className="session" ref={ref}>
      <div className="top"><span>EXPLAIN YOUR BUILD</span><span>ILLUSTRATIVE SESSION</span></div>
      <p className="q">“What did you change when the first approach didn’t work?”</p>
      <p className="a" aria-label={ANSWER}>{ANSWER.slice(0, n)}<span className="caret" aria-hidden /></p>
      <div className="between" style={{ marginTop: "auto", color: "#6b7280", fontSize: 13 }}>
        <span>Reasoning, not just results.</span><span>Voice or text · Human review</span>
      </div>
    </div>
  );
}

export function Reveal() {
  useEffect(() => {
    // Progressive enhancement: content is visible without JS; we only hide what's below the fold.
    const els = [...document.querySelectorAll(".reveal")].filter((el) => el.getBoundingClientRect().top > innerHeight);
    els.forEach((el) => el.classList.remove("in"));
    document.documentElement.classList.add("js-reveal");
    document.querySelectorAll(".reveal").forEach((el) => { if (!els.includes(el)) el.classList.add("in"); });
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.12 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}
