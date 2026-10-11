import type { ReactNode } from "react"
import { Link, useLocation } from "react-router-dom"
import { Check, LockKeyhole } from "lucide-react"
import { BrandGlyph, Wordmark } from "../components/layout/shell"

export function AuthLayout({ title, description, children, footer }: {
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
}) {
  const registering = useLocation().pathname === "/register"
  return (
    <div className="auth-page">
      <div className="auth-container">
        <aside className="auth-story" aria-label="About NexusCloud">
          <div className="auth-story-brand"><Wordmark /></div>
          <div className="auth-story-content">
            <p className="auth-eyebrow"><span /> BRING YOUR OWN CLOUD</p>
            <h2>Your clouds.<br />One intelligent<br /><span>platform.</span></h2>
            <p className="auth-story-description">
              Connect your cloud storage, manage your files, and make smarter storage decisions through one unified workspace.
            </p>
            <div className="auth-story-benefits">
              <span><Check size={14} aria-hidden /> Your accounts</span>
              <span><Check size={14} aria-hidden /> Your storage</span>
              <span><Check size={14} aria-hidden /> One workspace</span>
            </div>
          </div>
          <div className="auth-story-footer">
            <span>Storage, orchestrated.</span>
            <span className="auth-edition">NEXUSCLOUD / BYOC</span>
          </div>
        </aside>
        <main className="auth-main" id="main-content">
          <header className="auth-main-header">
            <span>{registering ? "Already have an account?" : "New to NexusCloud?"}</span>
            <Link to={registering ? "/login" : "/register"}>{registering ? "Sign in" : "Create an account"}</Link>
          </header>
          <div className="auth-form-wrap">
            <div className="auth-form-heading">
              <div className="auth-form-emblem"><BrandGlyph className="h-7 w-7" /></div>
              <p className="auth-form-eyebrow">YOUR NEXUSCLOUD WORKSPACE</p>
              <h1>{title}</h1>
              <p className="auth-form-description">{description}</p>
            </div>
            <div className="auth-form-content">{children}</div>
            {footer ? <div className="auth-form-footer">{footer}</div> : null}
            <div className="auth-form-note"><LockKeyhole size={13} aria-hidden /> Your cloud accounts. Your control.</div>
          </div>
          <footer className="auth-main-footer">
            <span>© {new Date().getFullYear()} NexusCloud</span>
            <div className="auth-legal-links"><Link to="/terms">Terms</Link><Link to="/privacy">Privacy</Link></div>
          </footer>
        </main>
      </div>
    </div>
  )
}
