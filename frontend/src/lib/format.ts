const GIB = 1024 ** 3
const MIB = 1024 ** 2
const KIB = 1024

/** Byte counts are integers; display in GiB/MiB per the API contract. */
export function formatBytes(bytes: number | null | undefined, precision: "auto" | "fixed" = "auto"): string {
  if (bytes === null || bytes === undefined || Number.isNaN(bytes)) return "—"
  if (bytes < KIB) return `${bytes} B`
  if (bytes < MIB) {
    const value = bytes / KIB
    return `${round(value, precision)} KiB`
  }
  if (bytes < GIB) {
    const value = bytes / MIB
    return `${round(value, precision)} MiB`
  }
  return `${round(bytes / GIB, precision)} GiB`
}

function round(value: number, precision: "auto" | "fixed"): string {
  const digits = precision === "fixed" ? 1 : value >= 100 ? 0 : value >= 10 ? 1 : 2
  const fixed = value.toFixed(digits)
  return digits > 0 ? fixed.replace(/\.?0+$/, "") : fixed
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return "—"
  const rounded = value >= 10 ? Math.round(value) : Math.round(value * 10) / 10
  return `${rounded}%`
}

const RELATIVE_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["week", 7 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
]

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "—"
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "—"
  const diffSeconds = (date.getTime() - Date.now()) / 1000
  const abs = Math.abs(diffSeconds)
  if (abs < 45) return diffSeconds >= 0 ? "in a moment" : "just now"
  for (const [unit, seconds] of RELATIVE_UNITS) {
    if (abs >= seconds) {
      const value = Math.round(diffSeconds / seconds)
      return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(value, unit)
    }
  }
  return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
    Math.round(diffSeconds / 60),
    "minute",
  )
}

export function formatDateDay(iso: string | null | undefined): string {
  if (!iso) return "—"
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "—"
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date)
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—"
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "—"
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return "—"
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "—"
  return new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" }).format(date)
}

/** File extension without the dot, uppercased; "—" when absent. */
export function fileExtension(name: string): string {
  const index = name.lastIndexOf(".")
  if (index <= 0 || index === name.length - 1) return "—"
  return name.slice(index + 1).toUpperCase()
}

export function initialsOf(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || "·"
}

export function truncateMiddle(value: string, max: number): string {
  if (value.length <= max) return value
  const head = Math.ceil((max - 1) / 2)
  const tail = Math.floor((max - 1) / 2)
  return `${value.slice(0, head)}…${value.slice(value.length - tail)}`
}
