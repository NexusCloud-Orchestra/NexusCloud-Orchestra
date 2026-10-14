import { cn } from "../../lib/utils"
import { useState } from "react"

export interface FieldProps {
  label: string
  htmlFor?: string
  hint?: string
  error?: string | null
  id?: string
  required?: boolean
  children: React.ReactNode
}

export function Field({ label, htmlFor, hint, error, id, required, children }: FieldProps) {
  const inputId = htmlFor ?? id ?? label.toLowerCase().replace(/\s+/g, "-")
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-xs font-medium text-ink-2">
        {label}
        {required && <span className="ml-1 text-brand">*</span>}
      </label>
      {children}
      {error ? <p className="text-xs text-bad">{error}</p> : hint ? <p className="text-xs text-ink-3">{hint}</p> : null}
    </div>
  )
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean
}

export function Input({
  className,
  invalid,
  ...props
}: InputProps) {
  return (
    <input
      className={cn("nc-input", invalid && "border-bad focus:border-bad focus:ring-bad/20", className)}
      {...props}
    />
  )
}

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean
}

export function Textarea({
  className,
  invalid,
  ...props
}: TextareaProps) {
  return (
    <textarea
      className={cn(
        "w-full rounded-sm border border-line bg-raise px-3 py-2.5 text-sm text-ink placeholder:text-ink-3 focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/20 transition-colors duration-fast resize-none",
        invalid && "border-bad focus:border-bad focus:ring-bad/20",
        className
      )}
      {...props}
    />
  )
}

export const TextArea = Textarea

let nextFieldId = 0
export function useFieldId(prefix = "field") {
  const [id] = useState(() => `${prefix}-${++nextFieldId}`)
  return id
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full h-9 rounded-sm border border-line bg-raise px-3 text-sm text-ink focus:border-brand/50 focus:outline-none transition-colors duration-fast",
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
}

