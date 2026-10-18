import { describe, expect, it } from "vitest"
import { shouldStripe } from "./uploads"

const MiB = 1024 ** 2

describe("shouldStripe", () => {
  it("is false when the user has not opted in", () => {
    expect(shouldStripe(20 * MiB, { striping_enabled: false }, ["r2", "b2"])).toBe(false)
  })

  it("is false when only temporary free tiers are connected", () => {
    expect(shouldStripe(20 * MiB, { striping_enabled: true }, ["aws", "azure"])).toBe(false)
  })

  it("is false with a single permanent provider even if temporary ones are present", () => {
    expect(shouldStripe(20 * MiB, { striping_enabled: true }, ["r2", "aws", "azure"])).toBe(false)
  })

  it("is false for files at or under 16 MiB", () => {
    expect(shouldStripe(16 * MiB, { striping_enabled: true }, ["r2", "b2"])).toBe(false)
  })

  it("is true for a large file with two permanent providers when enabled", () => {
    expect(shouldStripe(20 * MiB, { striping_enabled: true }, ["r2", "b2"])).toBe(true)
  })

  it("counts distinct providers only", () => {
    expect(shouldStripe(20 * MiB, { striping_enabled: true }, ["r2", "r2"])).toBe(false)
  })
})
