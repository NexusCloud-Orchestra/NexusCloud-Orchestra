import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const tokenResponse = () =>
  new Response(JSON.stringify({ access_token: "a1", token_type: "bearer", expires_in: 900 }), {
    status: 200,
  })

describe("session client", () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.resetModules()
    localStorage.clear()
    sessionStorage.clear()
    fetchMock = vi.fn(async () => tokenResponse())
    vi.stubGlobal("fetch", fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it("refreshSession sends credentials and the CSRF header", async () => {
    const { refreshSession, getAccessToken } = await import("./client")
    expect(await refreshSession()).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toMatch(/\/api\/v1\/auth\/refresh$/)
    expect(init.credentials).toBe("include")
    expect(new Headers(init.headers).get("X-NC-CSRF")).toBe("1")
    // Backend requires Content-Length on POST, so the empty body is "{}".
    expect(init.body).toBe("{}")
    expect(getAccessToken()).toBe("a1")
  })

  it("concurrent refreshSession calls share one request", async () => {
    const { refreshSession } = await import("./client")
    const results = await Promise.all([refreshSession(), refreshSession(), refreshSession()])
    expect(results).toEqual([true, true, true])
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("refreshSession serializes across tabs with Web Locks", async () => {
    const request = vi.fn(async (_name: string, cb: () => Promise<boolean>) => cb())
    vi.stubGlobal("navigator", { ...navigator, locks: { request } })
    const { refreshSession } = await import("./client")
    expect(await refreshSession()).toBe(true)
    expect(request).toHaveBeenCalledTimes(1)
    expect(request.mock.calls[0]?.[0]).toBe("nc-refresh")
  })

  it("never writes tokens to web storage", async () => {
    const local = vi.spyOn(Storage.prototype, "setItem")
    const { login } = await import("./auth")
    const { refreshSession } = await import("./client")
    await login("a@b.co", "pw")
    await refreshSession()
    expect(local).not.toHaveBeenCalled()
  })

  it("clears legacy stored refresh tokens on load", async () => {
    localStorage.setItem("nc.refresh", "old")
    sessionStorage.setItem("nc.refresh", "old")
    await import("./client")
    expect(localStorage.getItem("nc.refresh")).toBeNull()
    expect(sessionStorage.getItem("nc.refresh")).toBeNull()
  })

  it("ignores a dev_token query parameter", async () => {
    window.history.replaceState(null, "", "/?dev_token=evil")
    const setItem = vi.spyOn(Storage.prototype, "setItem")
    const { refreshSession } = await import("./client")
    await refreshSession()
    expect(setItem).not.toHaveBeenCalled()
    expect(JSON.stringify(fetchMock.mock.calls)).not.toContain("evil")
    window.history.replaceState(null, "", "/")
  })
})
