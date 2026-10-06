import { Link } from 'react-router-dom';
import Logo from './Logo';
import { ProviderIcon } from './providers';

const PROVIDER_IDS = ['aws', 'azure', 'gcp', 'r2', 'b2', 'oracle'];

/**
 * Shared split-screen layout for all public auth pages: a dark brand
 * panel with the orchestration diagram on the left, the form on the right.
 */
export default function AuthLayout({ children }) {
  return (
    <div className="auth-layout">
      <aside className="auth-visual">
        <div>
          <Link to="/" className="sidebar-brand" style={{ border: 'none', padding: 0, margin: 0 }}>
            <Logo />
          </Link>
          <h2 className="auth-visual-tagline">One orchestrator for every cloud you own.</h2>
          <p className="auth-visual-desc">
            NexusCloud routes your files across AWS, Azure, Google Cloud, Cloudflare R2 and more —
            while your credentials stay encrypted and your bytes never touch our servers.
          </p>

          <div className="auth-diagram" aria-hidden="true">
            <svg viewBox="0 0 300 190" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="115" y="72" width="70" height="44" rx="9" fill="rgba(79,125,249,0.9)" />
              <text x="150" y="98" fill="#fff" fontSize="11" fontWeight="700" textAnchor="middle" fontFamily="inherit">NEXUS</text>

              <rect x="18" y="18" width="56" height="32" rx="7" fill="rgba(255,255,255,0.05)" stroke="rgba(148,163,184,0.35)" />
              <text x="46" y="38" fill="#94A3B8" fontSize="10" fontWeight="600" textAnchor="middle" fontFamily="inherit">AWS</text>

              <rect x="226" y="18" width="56" height="32" rx="7" fill="rgba(255,255,255,0.05)" stroke="rgba(148,163,184,0.35)" />
              <text x="254" y="38" fill="#94A3B8" fontSize="10" fontWeight="600" textAnchor="middle" fontFamily="inherit">GCP</text>

              <rect x="18" y="140" width="56" height="32" rx="7" fill="rgba(255,255,255,0.05)" stroke="rgba(148,163,184,0.35)" />
              <text x="46" y="160" fill="#94A3B8" fontSize="10" fontWeight="600" textAnchor="middle" fontFamily="inherit">AZURE</text>

              <rect x="226" y="140" width="56" height="32" rx="7" fill="rgba(255,255,255,0.05)" stroke="rgba(148,163,184,0.35)" />
              <text x="254" y="160" fill="#94A3B8" fontSize="10" fontWeight="600" textAnchor="middle" fontFamily="inherit">R2</text>

              <path d="M74 36 L115 78" stroke="rgba(148,163,184,0.4)" strokeWidth="1.4" />
              <path d="M226 36 L185 78" stroke="rgba(148,163,184,0.4)" strokeWidth="1.4" />
              <path d="M74 154 L115 110" stroke="rgba(148,163,184,0.4)" strokeWidth="1.4" />
              <path d="M226 154 L185 110" stroke="rgba(148,163,184,0.4)" strokeWidth="1.4" />

              <circle r="3.2" fill="#38BDF8">
                <animateMotion dur="2.6s" repeatCount="indefinite" path="M 74 36 L 115 78" />
              </circle>
              <circle r="3.2" fill="#2DD4BF">
                <animateMotion dur="3.1s" repeatCount="indefinite" path="M 226 36 L 185 78" />
              </circle>
              <circle r="3.2" fill="#818CF8">
                <animateMotion dur="2.9s" repeatCount="indefinite" path="M 74 154 L 115 110" />
              </circle>
              <circle r="3.2" fill="#38BDF8">
                <animateMotion dur="3.4s" repeatCount="indefinite" path="M 226 154 L 185 110" />
              </circle>
            </svg>
          </div>
        </div>

        <div>
          <div className="auth-visual-providers">
            {PROVIDER_IDS.map((p) => (
              <ProviderIcon key={p} provider={p} size={26} />
            ))}
          </div>
          <p className="auth-visual-footnote">Zero Data Touch architecture — encrypted credentials, direct browser-to-cloud transfer</p>
        </div>
      </aside>

      <main className="auth-panel">
        <div className="auth-card">{children}</div>
      </main>
    </div>
  );
}
