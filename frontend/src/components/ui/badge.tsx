import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "badge",
  {
    variants: {
      variant: {
        default: "badge-accent",
        gold:    "badge-gold",
        ok:      "badge-ok",
        warn:    "badge-warn",
        bad:     "badge-bad",
        outline: "border border-line text-ink-2 bg-transparent",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

export function Badge({
  className,
  variant,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </span>
  )
}
