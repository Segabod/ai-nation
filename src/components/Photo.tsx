"use client";
import { useEffect, useRef, useState } from "react";

/** Brand photo that quietly falls back to the gradient panel behind it if the file is missing. */
export default function Photo({ src, alt }: { src: string; alt: string }) {
  const [ok, setOk] = useState(true);
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    // the image may have failed before hydration attached onError
    const el = ref.current;
    if (el && el.complete && el.naturalWidth === 0) setOk(false);
  }, []);
  if (!ok) return null;
  return <img ref={ref} src={src} alt={alt} onError={() => setOk(false)} />;
}
