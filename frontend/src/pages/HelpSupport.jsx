import { useState } from 'react';
import { ChevronDown, LifeBuoy, BookOpen, HeartPulse } from 'lucide-react';
import { API_URL } from '../config';

const FAQS = [
  {
    q: 'How do uploads work?',
    a: 'When you upload, NexusCloud asks the smart router for a signed URL, then your browser PUTs the bytes directly to the destination cloud bucket. The file content never passes through NexusCloud servers (Zero Data Touch).',
  },
  {
    q: 'Why did my direct upload fail with a network or CORS error?',
    a: 'The destination bucket/container must allow CORS from this app origin with the PUT method and the headers the signed URL requires (at minimum Content-Type). Add the origin in your provider console and retry.',
  },
  {
    q: 'Why did my upload confirmation return 409?',
    a: 'Confirmation is refused if the object has not appeared in the bucket, its size differs from the ticket, or the signed ticket expired (tickets live at most 15 minutes). Retry the upload to get a fresh ticket.',
  },
  {
    q: 'Why can\'t I disconnect a cloud?',
    a: 'Disconnect is refused (409) while files still live on that cloud, so you never lose access to your data. Delete those files first; credentials are then purged immediately.',
  },
  {
    q: 'Are the storage capacity numbers exact?',
    a: 'No. Per-connection limits are provider free-tier estimates, not live billing balances. Actual remaining free tier may differ; check your provider console for billing-accurate numbers.',
  },
  {
    q: 'Why do I have to sign in again after a full page reload?',
    a: 'Tokens are kept in memory only — never in localStorage or URLs — which is the safer option for a browser-only app, but it means a reload drops the session.',
  },
  {
    q: 'How do I run everything locally without cloud credentials?',
    a: 'With LOCAL_STORAGE_ENABLED=true (development only) the backend signs local /api/v1/local-objects URLs instead, so the entire upload/download flow works without real cloud accounts. This route stays disabled in production.',
  },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '16px 20px',
          background: 'transparent',
          border: 'none',
          color: 'var(--text)',
          fontFamily: 'var(--font-family)',
          fontSize: '0.92rem',
          fontWeight: 700,
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {q}
        <ChevronDown
          size={16}
          style={{ flexShrink: 0, transition: 'transform 200ms ease', transform: open ? 'rotate(180deg)' : 'none', color: 'var(--muted)' }}
        />
      </button>
      {open ? (
        <p style={{ padding: '0 20px 18px', margin: 0, color: 'var(--muted)', fontSize: '0.86rem', lineHeight: 1.65 }}>
          {a}
        </p>
      ) : null}
    </div>
  );
}

export default function HelpSupport() {
  return (
    <div className="page-content-wrapper" style={{ maxWidth: 860 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Help & Support</h1>
          <p className="page-subtitle">Setup guides, troubleshooting and service health.</p>
        </div>
      </div>

      <div className="grid grid-3">
        <a className="card feature-card" href={`${API_URL}/docs`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="feature-icon"><BookOpen size={20} /></div>
          <h3>API reference</h3>
          <p>Interactive OpenAPI docs for every endpoint, straight from the running backend.</p>
        </a>
        <a className="card feature-card" href={`${API_URL}/health`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="feature-icon"><HeartPulse size={20} /></div>
          <h3>Service health</h3>
          <p>Live database health check. Redis health is at /redis-health on the same origin.</p>
        </a>
        <div className="card feature-card">
          <div className="feature-icon"><LifeBuoy size={20} /></div>
          <h3>Bucket CORS setup</h3>
          <p>Allow this app's origin with PUT + Content-Type on every bucket you connect, or direct uploads will be blocked by the browser.</p>
        </div>
      </div>

      <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: 6 }}>Frequently asked questions</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {FAQS.map((f) => (
          <FaqItem key={f.q} q={f.q} a={f.a} />
        ))}
      </div>
    </div>
  );
}
