// Node >= 25 defines its own `localStorage` global (undefined without
// --localstorage-file), which shadows jsdom's. Restore jsdom's Storage objects.
const dom = (globalThis as { jsdom?: { window: Window } }).jsdom
if (dom) {
  for (const key of ["localStorage", "sessionStorage"] as const) {
    Object.defineProperty(globalThis, key, { configurable: true, get: () => dom.window[key] })
  }
}
