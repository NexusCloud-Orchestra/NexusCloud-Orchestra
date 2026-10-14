import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C49A3A]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFDF8] disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer tracking-tight",
  {
    variants: {
      variant: {
        primary:
          "bg-[#142B4A] hover:bg-[#0B1B32] text-white border border-[#142B4A] shadow-sm hover:shadow-md active:scale-[0.98] font-bold",
        gold:
          "bg-gradient-to-b from-[#CFA441] to-[#C49A3A] hover:from-[#C49A3A] hover:to-[#B38728] text-white border border-[#A77B26]/80 shadow-sm hover:shadow-md active:scale-[0.98] font-bold text-shadow-2xs",
        secondary:
          "bg-[#FAF6ED] hover:bg-[#FFF8E7] text-[#142B4A] border border-[#E8E0D1] hover:border-[#C49A3A]/60 active:scale-[0.98] shadow-2xs font-semibold",
        outline:
          "bg-white hover:bg-[#FAF6ED] text-[#142B4A] border border-[#E8E0D1] hover:border-[#C49A3A]/60 active:scale-[0.98] shadow-2xs font-medium",
        ghost:
          "bg-transparent hover:bg-[#FAF6ED] text-[#344256] hover:text-[#142B4A] active:scale-[0.98] font-medium",
        destructive:
          "bg-[#C43D4B]/10 hover:bg-[#C43D4B]/20 text-[#C43D4B] border border-[#C43D4B]/30 active:scale-[0.98] font-semibold",
        danger:
          "bg-[#C43D4B] hover:bg-[#A82D3A] text-white border border-[#A82D3A] shadow-sm active:scale-[0.98] font-bold",
        link:
          "bg-transparent text-[#C49A3A] hover:text-[#A77B26] underline-offset-4 hover:underline p-0 h-auto font-semibold",
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-lg",
        md: "h-9.5 px-4 text-xs sm:text-sm rounded-xl",
        lg: "h-11 px-6 text-sm sm:text-base rounded-xl font-bold shadow-sm",
        icon: "h-9 w-9 p-0 rounded-xl",
        "icon-sm": "h-8 w-8 p-0 rounded-lg",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
}

export function Button({ className, variant, size, loading, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="h-4 w-4 animate-spin shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      ) : null}
      {children}
    </button>
  )
}
