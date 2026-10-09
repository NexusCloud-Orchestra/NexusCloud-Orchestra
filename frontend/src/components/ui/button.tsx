import type { ButtonHTMLAttributes, ReactNode } from "react"
import { Loader2 } from "lucide-react"

type Variant = "primary" | "secondary" | "ghost" | "danger"
type Size = "sm" | "md" | "lg"

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-accent text-on-accent border-accent font-semibold hover:bg-accent-deep hover:border-accent-deep hover:-translate-y-px active:translate-y-0",
  secondary:
    "bg-ink/[0.06] text-ink border-line-strong backdrop-blur-sm hover:border-ink hover:-translate-y-px active:translate-y-0",
  ghost: "bg-transparent text-ink-2 border-transparent hover:bg-ink/[0.06] hover:text-ink active:translate-y-px",
  danger:
    "bg-transparent text-bad border-bad-line hover:border-bad hover:bg-bad-wash active:translate-y-px",
}

const SIZE: Record<Size, string> = {
  sm: "h-8 px-3.5 text-sm gap-1.5",
  md: "h-9 px-4 text-base gap-2",
  lg: "h-11 px-6 text-md gap-2",
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  children?: ReactNode
}

export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  className = "",
  disabled,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`inline-flex select-none items-center justify-center whitespace-nowrap rounded-full border font-medium transition-all duration-fast ease-out disabled:pointer-events-none disabled:opacity-45 ${VARIANT[variant]} ${SIZE[size]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Loader2 size={13} className="animate-spin" aria-hidden /> : null}
      {children}
    </button>
  )
}
