import { forwardRef, useId } from "react"
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react"

export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
}: {
  label: string
  hint?: string
  error?: string | null
  htmlFor?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-sm text-bad" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-sm text-ink-3">{hint}</p>
      ) : null}
    </div>
  )
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className = "", invalid = false, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={`h-8.5 w-full rounded-sm border bg-surface px-2.5 text-base text-ink transition-colors duration-fast ease-out placeholder:text-ink-3 hover:border-line-strong focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 disabled:cursor-not-allowed disabled:bg-raise disabled:text-ink-3 ${
        invalid ? "border-bad" : "border-line"
      } ${className}`}
      {...rest}
    />
  )
})

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { className = "", invalid = false, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={`min-h-[76px] w-full rounded-sm border bg-surface px-2.5 py-2 font-mono text-sm text-ink transition-colors duration-fast ease-out placeholder:text-ink-3 hover:border-line-strong focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 ${
        invalid ? "border-bad" : "border-line"
      } ${className}`}
      {...rest}
    />
  )
})

/** Hook giving a field a stable id for label wiring. */
export function useFieldId(): string {
  return useId()
}
