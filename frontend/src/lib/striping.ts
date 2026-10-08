export const CHUNK_BYTES = 16 * 1024 ** 2
const PREFIX = new TextEncoder().encode("nexuscloud-stripe-v1\0")
const PREFIX_V2 = new TextEncoder().encode("nexuscloud-stripe-v2\0")

interface IndexedChunk {
  index: number
  chunk_id: string
  connection_id: string
  provider: string
  size_bytes: number
  sha256: string
}

function hex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

function fromHex(value: string): Uint8Array {
  if (!/^[0-9a-f]{64}$/.test(value)) throw new Error("Invalid chunk hash")
  return Uint8Array.from(value.match(/../g) ?? [], (pair) => parseInt(pair, 16))
}

function uuidBytes(value: string): Uint8Array {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error("Invalid index UUID")
  }
  return Uint8Array.from((value.replace(/-/g, "").toLowerCase().match(/../g) ?? []), (pair) => parseInt(pair, 16))
}

export async function sha256(bytes: Blob | ArrayBuffer): Promise<string> {
  const buffer = bytes instanceof Blob ? await bytes.arrayBuffer() : bytes
  return hex(new Uint8Array(await crypto.subtle.digest("SHA-256", buffer)))
}

export async function stripeIndexHash(chunks: Array<{ size_bytes: number; sha256: string }>): Promise<string> {
  const payload = new Uint8Array(PREFIX.length + chunks.length * 40)
  payload.set(PREFIX)
  const view = new DataView(payload.buffer)
  chunks.forEach((chunk, index) => {
    const offset = PREFIX.length + index * 40
    view.setBigUint64(offset, BigInt(chunk.size_bytes), false)
    payload.set(fromHex(chunk.sha256), offset + 8)
  })
  return sha256(payload.buffer)
}

export async function stripeManifestHash(sizeBytes: number, chunks: IndexedChunk[]): Promise<string> {
  const providers = chunks.map((chunk) => new TextEncoder().encode(chunk.provider))
  const length = PREFIX_V2.length + 8 + 4 +
    providers.reduce((sum, provider) => sum + 8 + 32 + 16 + 16 + 1 + provider.length, 0)
  const payload = new Uint8Array(length)
  payload.set(PREFIX_V2)
  const view = new DataView(payload.buffer)
  let offset = PREFIX_V2.length
  view.setBigUint64(offset, BigInt(sizeBytes), false)
  offset += 8
  view.setUint32(offset, chunks.length, false)
  offset += 4
  chunks.forEach((chunk, index) => {
    const provider = providers[index]
    if (!provider || provider.length > 255) throw new Error("Invalid index provider")
    view.setBigUint64(offset, BigInt(chunk.size_bytes), false)
    offset += 8
    payload.set(fromHex(chunk.sha256), offset)
    offset += 32
    payload.set(uuidBytes(chunk.chunk_id), offset)
    offset += 16
    payload.set(uuidBytes(chunk.connection_id), offset)
    offset += 16
    payload[offset] = provider.length
    offset += 1
    payload.set(provider, offset)
    offset += provider.length
  })
  return sha256(payload.buffer)
}

export async function verifyStripeIndex(index: {
  index_version: number
  index_hash: string
  size_bytes: number
  chunks: IndexedChunk[]
}): Promise<boolean> {
  const { chunks, size_bytes: size } = index
  if (!Number.isSafeInteger(size) || size <= CHUNK_BYTES || size > 5 * 1024 ** 3 ||
      chunks.length !== Math.ceil(size / CHUNK_BYTES) ||
      chunks.some((chunk, position) =>
        chunk.index !== position ||
        chunk.size_bytes !== Math.min(CHUNK_BYTES, size - position * CHUNK_BYTES)
      ) ||
      new Set(chunks.map((chunk) => chunk.provider)).size < 2 ||
      new Set(chunks.map((chunk) => chunk.chunk_id)).size !== chunks.length) return false
  try {
    const actual = index.index_version === 1
      ? await stripeIndexHash(chunks)
      : index.index_version === 2
        ? await stripeManifestHash(size, chunks)
        : null
    return actual === index.index_hash
  } catch {
    return false
  }
}
