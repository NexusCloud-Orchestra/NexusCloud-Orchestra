import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, CloudUpload, Route, Lock, Gauge, Check } from 'lucide-react';
import Logo from '../components/Logo';
import { ProviderIcon, providerMeta } from '../components/providers';
import { catalogApi } from '../lib/api';
import { formatBytes, planLabel } from '../lib/utils';

const FEATURES = [
  {
    icon: Route,
    title: 'Smart placement routing',
    text: 'Every upload is scored across your connected clouds by free capacity, egress cost and permanence, then placed on the best fit automatically.',
  },
  {
    icon: ShieldCheck,
    title: 'Zero Data Touch',
    text: 'File bytes move directly between your browser and your own cloud buckets over provider-signed URLs. NexusCloud never stores content.',
  },
  {
    icon: Lock,
    title: 'Encrypted credentials',
    text: 'Cloud keys are encrypted at rest with AES-256-GCM and only decrypted in memory long enough to mint a signed URL.',
  },
  {
    icon: CloudUpload,
    title: 'Direct-to-cloud uploads',
    text: 'Browser PUTs straight to the destination bucket with live progress — no proxy bottleneck, no double bandwidth billing.',
  },
  {
    icon: Gauge,
    title: 'Unified quota',
    text: 'See pooled capacity, per-connection usage and pending reservations across every provider from one dashboard.',
  },
  {
    icon: ShieldCheck,
    title: 'Account security trail',
    text: 'Sign-ins, password changes and connection events are recorded in an audit log you can review any time.',
  },
];

export default function Home() {
  const [providers, setProviders] = useState([]);
  const [plans, setPlans] = useState([]);
  const [catalogFailed, setCatalogFailed] = useState(false);

  useEffect(() => {
    Promise.all([catalogApi.providers(), catalogApi.plans()])
      .then(([p, pl]) => {
        setProviders(p || []);
        setPlans(pl || []);
      })
      .catch(() => setCatalogFailed(true));
  }, []);

  return (
    <div className="landing">
      <nav className="landing-nav">
        <span className="sidebar-brand" style={{ border: 'none', padding: 0, margin: 0 }}>
          <Logo />
        </span>
        <div className="landing-nav-links">
          <Link to="/login" className="btn btn-ghost btn-sm">Sign in</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Get started</Link>
        </div>
      </nav>

      <section className="landing-hero">
        <span className="hero-eyebrow">Multi-cloud storage orchestration</span>
        <h1 className="hero-title">
          Pool every free tier into <span className="gradient-text">one intelligent drive</span>
        </h1>
        <p className="hero-sub">
          Connect AWS S3, Azure Blob, Google Cloud, Cloudflare R2, Backblaze B2, Oracle and IBM.
          NexusCloud routes each file to the best destination while your data never leaves your own clouds.
        </p>
        <div className="hero-ctas">
          <Link to="/register" className="btn btn-primary">Create free account</Link>
          <Link to="/login" className="btn btn-ghost">Sign in</Link>
        </div>
        <p className="hero-note">Free plan includes 2 cloud connections and 5 GiB of routed storage.</p>
      </section>

      <section className="landing-section">
        <div className="landing-section-head">
          <h2 className="landing-section-title">Built for ownership, not lock-in</h2>
          <p className="landing-section-sub">Your buckets, your keys, your bytes — we only orchestrate.</p>
        </div>
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="card feature-card">
              <div className="feature-icon">
                <f.icon size={20} />
              </div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section-head">
          <h2 className="landing-section-title">Supported providers</h2>
          <p className="landing-section-sub">
            Free-tier figures are estimates published by each provider, not live billing balances.
          </p>
        </div>
        {catalogFailed ? (
          <p style={{ textAlign: 'center', color: 'var(--muted)' }}>
            Provider catalog is unavailable right now — the API may be offline.
          </p>
        ) : (
          <div className="provider-grid">
            {providers.map((p) => (
              <div key={p.name} className="card provider-tile">
                <ProviderIcon provider={p.name} size={34} />
                <div>
                  <div className="provider-tile-name">{providerMeta(p.name).name}</div>
                  <div className="provider-tile-meta">
                    ~{formatBytes(p.free_bytes)} free tier{p.permanent ? ' · always free' : ' · 12 months'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="landing-section">
        <div className="landing-section-head">
          <h2 className="landing-section-title">Plans</h2>
          <p className="landing-section-sub">Start free. Paid upgrades open once billing is integrated.</p>
        </div>
        {plans.length > 0 ? (
          <div className="pricing-grid">
            {plans.map((plan) => (
              <div key={plan.name} className={`card plan-card${plan.name === 'free' ? ' featured' : ''}`}>
                <div className="plan-card-name">
                  {planLabel(plan.name)}
                  {plan.name === 'free' ? <span className="badge badge-accent">Current offer</span> : null}
                </div>
                <ul className="plan-features">
                  <li><Check size={15} /> {plan.max_connections ? `Up to ${plan.max_connections} cloud connections` : 'Unlimited cloud connections'}</li>
                  <li><Check size={15} /> {plan.max_bytes ? `${formatBytes(plan.max_bytes)} pooled storage` : 'Unlimited pooled storage'}</li>
                  <li><Check size={15} /> {plan.seats} {plan.seats === 1 ? 'seat' : 'seats'}</li>
                </ul>
                <Link to="/register" className={`btn ${plan.name === 'free' ? 'btn-primary' : 'btn-ghost'} btn-block`}>
                  {plan.name === 'free' ? 'Start free' : 'Coming with billing'}
                </Link>
              </div>
            ))}
          </div>
        ) : (
          !catalogFailed && <p style={{ textAlign: 'center', color: 'var(--muted)' }}>Loading plans…</p>
        )}
      </section>

      <section className="landing-cta card">
        <h2>Ready to unify your clouds?</h2>
        <p>Connect your first provider in minutes and let the router do the rest.</p>
        <Link to="/register" className="btn btn-primary">Create free account</Link>
      </section>

      <footer className="landing-footer">
        <span>NexusCloud — multi-cloud storage orchestrator</span>
        <span>Zero Data Touch · AES-256-GCM credential encryption</span>
      </footer>
    </div>
  );
}
