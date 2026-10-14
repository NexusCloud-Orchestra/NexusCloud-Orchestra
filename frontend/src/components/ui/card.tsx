import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const cardVariants = cva(
  "rounded-xl border transition-all duration-150",
  {
    variants: {
      variant: {
        default: "border-[#E8E0D1] bg-white shadow-xs",
        elevated: "border-[#E8E0D1] bg-white shadow-sm hover:shadow-md hover:border-[#C49A3A]/40",
        interactive: "border-[#E8E0D1] bg-white shadow-xs hover:border-[#C49A3A] hover:shadow-sm cursor-pointer",
        muted: "border-[#E8E0D1] bg-[#FAF6ED]/70",
        flat: "border-transparent bg-[#FAF6ED]",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

export function Card({
  className,
  variant,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof cardVariants>) {
  return (
    <div className={cn(cardVariants({ variant }), className)} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 pt-4 pb-2", className)} {...props}>{children}</div>
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 pb-5 pt-2", className)} {...props}>{children}</div>
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-sm font-bold text-[#142B4A]", className)} {...props}>{children}</h3>
}

export function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-xs text-[#68768A] mt-0.5", className)} {...props}>{children}</p>
}
