export default function Logo({ compact = false, to = null }) {
  const mark = (
    <span className="brand-mark" aria-hidden="true">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.5 19a4.5 4.5 0 1 0-.42-8.98 6 6 0 1 0-11.06 3.1A3.5 3.5 0 0 0 7 19.5h10.5" />
      </svg>
    </span>
  );

  if (compact) return mark;

  return (
    <>
      {mark}
      <span className="brand-text">
        Nexus<em>Cloud</em>
      </span>
    </>
  );
}
