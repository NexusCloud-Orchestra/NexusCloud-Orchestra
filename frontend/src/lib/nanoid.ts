export function nanoid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `id-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
}
