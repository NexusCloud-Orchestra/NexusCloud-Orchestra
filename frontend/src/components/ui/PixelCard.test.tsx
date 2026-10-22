import { describe, expect, it } from "vitest"
import { renderToString } from "react-dom/server"
import PixelCard from "./PixelCard"

describe("PixelCard Component", () => {
  it("renders with default props and children", () => {
    const html = renderToString(
      <PixelCard>
        <div data-testid="card-content">Basic Content</div>
      </PixelCard>
    )

    expect(html).toContain("pixel-card")
    expect(html).toContain("pixel-card-canvas")
    expect(html).toContain("Basic Content")
  })

  it("supports gold variant and theme options matching landing page", () => {
    const html = renderToString(
      <PixelCard
        variant="gold"
        theme="light"
        gap={4}
        speed={25}
        shape="square"
        radius={20}
        className="plan-card--pixel"
      >
        <h3>Starter Plan</h3>
        <p>₹249 / month</p>
      </PixelCard>
    )

    expect(html).toContain("pixel-card")
    expect(html).toContain("plan-card--pixel")
    expect(html).toContain('data-theme="light"')
    expect(html).toContain("Starter Plan")
    expect(html).toContain("₹249 / month")
    expect(html).toContain("--pixel-card-radius:20px")
  })
})
