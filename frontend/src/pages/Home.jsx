import { Link } from 'react-router-dom';
import '../css/Home.css';

function Home() {
  return (
    <div className="home-page">
      {/* Header / Navbar */}
      <header className="home-header">
        <nav className="home-nav">
          <Link to="/" className="logo-container">
            <div className="logo-icon">☁️</div>
            <span>nexus cloud</span>
          </Link>

          <div className="nav-links">
            <a href="#features" className="nav-link">Features</a>
            <a href="#how" className="nav-link">How it works</a>
            <a href="#providers" className="nav-link">Providers</a>
          </div>

          <div className="nav-actions">
            <Link to="/login" className="btn-signin">Sign in</Link>
            <Link to="/register" className="btn-primary">
              Get Started <span className="arrow">→</span>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="hero-section">
        <div className="badge-container">
          <span className="badge-sparkle">⚡</span>
          <span>Unified Cloud Storage Orchestration</span>
        </div>

        <h1 className="hero-title">
          Master your clouds.
          <span className="italic-gradient">Unify your storage.</span>
        </h1>

        <p className="hero-subtitle">
          Connect AWS, GCP, Azure, R2, and Backblaze. Turn upto 70+ GB of idle free tiers into a single, smart-routed, zero-egress cloud drive—complete with one API and dashboard.
        </p>

        <div className="hero-ctas">
          <Link to="/register" className="btn-primary btn-large">
            Connect your clouds <span className="arrow">→</span>
          </Link>
          <a href="#how" className="btn-secondary">
            See how it works
          </a>
        </div>

        {/* Social Proof / Cloud Providers */}
        <section id="providers" className="social-proof">
          <span className="social-title">Supported Cloud Providers</span>
          <div className="logo-grid">
            <span className="social-logo">Amazon S3</span>
            <span className="social-logo">Google Cloud</span>
            <span className="social-logo">Azure Blob</span>
            <span className="social-logo">Cloudflare R2</span>
            <span className="social-logo">Backblaze B2</span>
          </div>
        </section>
      </main>

      {/* Features Section */}
      <section id="features" className="features-section">
        <span className="section-label">Features</span>
        <h2 className="section-title">Designed for multi-cloud efficiency</h2>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>Smart Routing</h3>
            <p>Automatically scores and routes uploads to the cheapest, fastest, or free tier cloud dynamically based on size and access patterns.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔌</div>
            <h3>Unified API</h3>
            <p>Interact with all your buckets through a single S3-compatible API. Stop managing multiple SDKs, credentials, and endpoints.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🛡️</div>
            <h3>Egress Optimization</h3>
            <p>Utilize free tier allowances and smart CDN/proximity caching to avoid expensive cloud egress fee traps.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
