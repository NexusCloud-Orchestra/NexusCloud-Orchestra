import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { Wordmark } from "../components/layout/shell"
import cloudImage from "../assets/auth-clouds.webp"

export function AuthLayout({ title, description, children, footer }: {
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="auth-page">
      <div className="auth-container">
        <aside className="auth-story" aria-label="About NexusCloud">
          <div className="auth-story-brand"><Wordmark /></div>
          <div className="auth-story-content">
            <h2>Your clouds.<br />One workspace.</h2>
            <p className="auth-story-description">
              Bring your own cloud storage.<br />
              Connect, organize, and route your files from one place.
            </p>
          </div>
          <img className="auth-cloud-image" src={cloudImage} alt="" width={1200} height={800} />
          <div className="auth-story-footer">
            <span>YOUR STORAGE. YOUR CONTROL.</span>
          </div>
        </aside>
        <main className="auth-main" id="main-content">
          <header className="auth-main-header">
            <span>BRING YOUR OWN CLOUD</span>
          </header>
          <div className="auth-form-wrap">
            <div className="auth-form-heading">
              <h1>{title}</h1>
              <p className="auth-form-description">{description}</p>
            </div>
            <div className="auth-form-content">{children}</div>
            {footer ? <div className="auth-form-footer">{footer}</div> : null}
          </div>
          <footer className="auth-main-footer">
            <div className="auth-legal-links"><Link to="/terms">Terms of Service</Link><span aria-hidden>·</span><Link to="/privacy">Privacy Policy</Link></div>
          </footer>
        </main>
      </div>
      <p className="auth-page-copyright">© {new Date().getFullYear()} NexusCloud Orchestra</p>
    </div>
  )
}
