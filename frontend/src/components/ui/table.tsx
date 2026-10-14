import * as React from "react"

export function Table({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="relative w-full overflow-auto">
      <table className={`w-full caption-bottom text-sm ${className}`} {...props} />
    </div>
  )
}

export function TableHeader({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={`border-b border-line bg-raise/50 [&_tr]:border-b ${className}`} {...props} />
}

export function TableBody({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={`[&_tr:last-child]:border-0 ${className}`} {...props} />
}

export function TableFooter({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tfoot
      className={`border-t border-line bg-raise/50 font-medium [&>tr]:last:border-b-0 ${className}`}
      {...props}
    />
  )
}

export function TableRow({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={`border-b border-line transition-colors hover:bg-raise/60 data-[state=selected]:bg-raise ${className}`}
      {...props}
    />
  )
}

export function TableHead({
  className = "",
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={`h-10 px-4 text-left align-middle font-mono text-2xs uppercase tracking-kicker text-ink-3 [&:has([role=checkbox])]:pr-0 ${className}`}
      {...props}
    />
  )
}

export function TableCell({
  className = "",
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={`p-4 align-middle text-ink-2 [&:has([role=checkbox])]:pr-0 ${className}`}
      {...props}
    />
  )
}

export function TableCaption({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLTableCaptionElement>) {
  return <caption className={`mt-4 text-xs text-ink-3 ${className}`} {...props} />
}
