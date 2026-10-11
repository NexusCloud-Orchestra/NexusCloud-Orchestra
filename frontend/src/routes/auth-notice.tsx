import { useEffect, useId, useRef } from "react"
import type { ReactNode } from "react"
import { Check, Mail, RotateCcw } from "lucide-react"

export function AuthNotice({
  kind,
  title,
  children,
}: {
  kind: "inbox" | "success" | "invalid"
  title: string
  children: ReactNode
}) {
  const headingId = useId()
  const noticeRef = useRef<HTMLDivElement>(null)
  const Icon = kind === "inbox" ? Mail : kind === "success" ? Check : RotateCcw

  useEffect(() => {
    noticeRef.current?.focus()
  }, [])

  return (
    <div className={`auth-notice auth-notice-${kind}`} ref={noticeRef} tabIndex={-1} role="region" aria-labelledby={headingId}>
      <div className="auth-notice-icon"><Icon size={22} strokeWidth={1.5} aria-hidden="true" /></div>
      <h2 id={headingId}>{title}</h2>
      <div className="auth-notice-body">{children}</div>
    </div>
  )
}
