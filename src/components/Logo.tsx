export function Logo() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3a9bff" />
          <stop offset="1" stopColor="#0b67c9" />
        </linearGradient>
      </defs>
      <path d="M16 3a13 13 0 1 0 13 13h-6a7 7 0 1 1-7-7V3z" fill="url(#lg)" />
      <circle cx="25" cy="7" r="3.2" fill="#f7a01e" />
    </svg>
  );
}
