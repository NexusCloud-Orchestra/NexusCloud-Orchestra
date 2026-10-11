import { Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Wordmark } from "../components/layout/shell"

export function LegalPage({ kind }: { kind: "terms" | "privacy" }) {
  const title = kind === "terms" ? "Terms of Service" : "Privacy Policy"
  return (
    <main className="legal-page">
      <Wordmark />
      <h1>{title}</h1>
      <p className="text-ink-3">NexusCloud / Product policies</p>
      <section className="legal-review" aria-labelledby="legal-review-heading">
        <p className="label-caps !text-accent">Pending owner and legal review</p>
        <h2 id="legal-review-heading" className="!mt-3">Approved policy content is not available.</h2>
        <p>The existing application does not contain approved {kind === "terms" ? "terms of service" : "privacy policy"} text.
          This page is a publication placeholder and does not constitute a company policy.</p>
      </section>
      <h2>Before publication</h2>
      <p>The NexusCloud owner must supply and approve this document before it can be presented as an effective policy.
        No security, compliance, retention, or data residency commitments are made on this page.</p>
      <div className="mt-10 flex flex-wrap items-center gap-6">
        <Link to="/login" className="inline-flex min-h-11 items-center gap-2 font-medium"><ArrowLeft size={16} /> Back to sign in</Link>
        <Link to={kind === "terms" ? "/privacy" : "/terms"} className="underline underline-offset-4">
          {kind === "terms" ? "Privacy Policy" : "Terms of Service"}
        </Link>
      </div>
    </main>
  )
}
