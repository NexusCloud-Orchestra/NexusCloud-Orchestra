import type { ButtonHTMLAttributes, ReactNode } from "react"
import { Loader2 } from "lucide-react"

type Variant = "primary" | "secondary" | "ghost" | "danger"
type Size = "sm" | "md" | "lg"

const VARIANT: Record<Variant, string> = {
  primary: "bg-accent text-on-accent border-accent font-semibold hover:bg-accent-deep hover:border-accent-deep",
  secondary: "bg-transparent text-ink border-line-strong hover:border-ink-2 hover:bg-raise",
  ghost: "bg-transparent text-ink-2 border-transparent hover:bg-raise hover:text-ink",
  danger: "bg-transparent text-bad border-bad-line hover:border-bad hover:bg-bad-wash",
}

const SIZE: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-9 px-4 text-base gap-2",
  lg: "h-11 px-6 text-md gap-2",
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  children?: ReactNode
}

/** Pills are for buttons and chips only (DESIGN.md: Shapes). */
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
      className={`inline-flex select-none items-center justify-center whitespace-nowrap rounded-full border font-medium transition-colors duration-fast ease-out disabled:pointer-events-none disabled:opacity-45 ${VARIANT[variant]} ${SIZE[size]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Loader2 size={13} className="animate-spin" aria-hidden /> : null}
      {children}
    </button>
  )
}

/** Same look as Button, for navigation. */
export function buttonClass(variant: Variant = "secondary", size: Size = "sm"): string {
  return `inline-flex select-none items-center justify-center whitespace-nowrap rounded-full border font-medium transition-colors duration-fast ease-out ${VARIANT[variant]} ${SIZE[size]}`
}
