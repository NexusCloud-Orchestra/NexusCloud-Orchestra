import { describe, expect, it } from "vitest"
import { renderToString } from "react-dom/server"
import OrbitImages from "./OrbitImages"

describe("OrbitImages Component", () => {
  it("renders with basic props and images array", () => {
    const images = [
      "https://example.com/1.png",
      "https://example.com/2.png",
      "https://example.com/3.png",
    ]

    const html = renderToString(
      <OrbitImages
        images={images}
        shape="ellipse"
        radiusX={340}
        radiusY={80}
        rotation={-8}
        duration={30}
        itemSize={90}
        depth={0.6}
        showPath
        centerContent={<h2>Moments</h2>}
      />
    )

    expect(html).toContain("orbit-container")
    expect(html).toContain("orbit-item")
    expect(html).toContain("https://example.com/1.png")
    expect(html).toContain("https://example.com/2.png")
    expect(html).toContain("https://example.com/3.png")
    expect(html).toContain("Moments")
  })

  it("renders with custom shape, object images, and path", () => {
    const images = [
      { src: "https://example.com/aws.svg", alt: "AWS S3" },
      { src: "https://example.com/gcp.svg", alt: "Google Cloud" },
    ]

    const html = renderToString(
      <OrbitImages
        images={images}
        shape="circle"
        radius={200}
        showPath
        pathColor="#FFD700"
      />
    )

    expect(html).toContain("orbit-container")
    expect(html).toContain("AWS S3")
    expect(html).toContain("Google Cloud")
    expect(html).toContain('stroke="#FFD700"')
  })
})
