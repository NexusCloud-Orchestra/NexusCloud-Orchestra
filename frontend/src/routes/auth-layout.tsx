import type { ReactNode } from "react"
import { Wordmark } from "../components/layout/shell"

/** Auth pages: one compact card on the night ground, no illustration. */
export function AuthLayout({
  title,
  description,
  children,
  footer,
}: {
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-14 items-center justify-between border-b border-line px-5 lg:px-10">
        <Wordmark />
        <a
          href="/"
          className="text-sm text-ink-2 transition-colors duration-fast ease-out hover:text-ink"
        >
          Back to home
        </a>
      </header>
      <main className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="animate-fade-rise w-full max-w-[440px]">
          <div className="surface w-full rounded-lg border border-line p-7 sm:p-8">
            <h1 className="font-display text-3xl font-bold tracking-tight text-ink">{title}</h1>
            <p className="mt-2 max-w-prose text-base text-ink-2">{description}</p>
            <div className="mt-7">{children}</div>
            {footer ? <div className="mt-6 border-t border-line pt-5 text-base text-ink-2">{footer}</div> : null}
          </div>
        </div>
      </main>
    </div>
  )
}
