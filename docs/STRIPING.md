# Cross-cloud stripe index

The API is the control plane; browser PUT and GET requests carry bytes directly to user-owned cloud buckets. A logical file is split into ordered 16 MiB chunks, with the final chunk shorter. Placement requires at least two distinct provider types. Each chunk is assigned an immutable chunk ID, connection ID, provider, object key, size, and client-computed SHA-256. The object key and credentials never appear in the public manifest; signed URLs are requested separately.

## Common index

New files use index version 2. The same index is returned in the upload ticket and read manifest, and is checked before the browser uploads or retrieves chunks. Integers are unsigned, big-endian. UUIDs are 16 raw bytes, not text. Provider names are ASCII and length-prefixed by one byte. Chunk order is implicit in the repeated records:

```text
SHA-256(
  "nexuscloud-stripe-v2\0"
  || uint64(file_size)
  || uint32(chunk_count)
  || repeated(
       uint64(chunk_size)
       || raw_sha256[32]
       || chunk_uuid[16]
       || connection_uuid[16]
       || uint8(provider_name_length)
       || provider_name
     )
)
```

The hash commits to content and placement. Changing the order, size, content hash, chunk identity, connection, or provider invalidates the index. Version 1 files remain readable using the earlier content-only hash; migration `0003_manifest_index_v2` defaults existing rows to version 1. A file is not deduplicated merely because its content matches another file: its v2 index includes distinct placement IDs.

## Upload

1. The browser hashes each local chunk and submits the ordered sizes and hashes. The API validates count, exact 16 MiB boundaries, total size, plan quota, and the presence of two provider types.
2. Placement rotates across distinct providers. Within each provider, the Smart Router selects a connection that has enough unreserved capacity. A user-row lock serializes reservations for the account.
3. The API creates all pending chunk rows and the versioned index in one database transaction, then returns the complete placement map. The browser recomputes the index and checks every assigned size/hash before requesting signed PUT URLs.
4. The browser PUTs each chunk directly to its assigned bucket. Confirmation checks object existence and size on every provider before atomically activating the manifest and charging quota.

The API does not read chunk bytes at confirmation, so SHA-256 values are client assertions. The browser verifies bytes again on retrieval; an independent server-side content audit would require reading provider objects and is not implemented. An already-issued cloud PUT URL may also overwrite a confirmed chunk before that URL expires. The index detects the altered content during retrieval but cannot repair it. Production rollout needs provider-enforced write-once/version-pinned objects or an equivalent immutable upload protocol across every supported BYOC provider.

## Retrieval and failure

The API validates the stored manifest's count, sequence, sizes, ownership, provider diversity, and versioned hash before returning it or issuing a signed URL. The browser validates the same index, fetches chunks in order, checks each chunk's byte length and SHA-256, and only then writes it to the output. Where a browser offers a file-save stream, chunks are written incrementally; other browsers use an in-memory fallback capped at 512 MiB.

This is striping, not replication or erasure coding. If any provider loses a chunk, the file cannot be reconstructed. Cancelled uploads release reserved quota immediately, but provider credentials remain connected until the 15-minute signed PUT window ends and the cleanup worker sweeps late writes. Partial deletion stays hidden and is retried; quota is released only after every chunk delete succeeds. `cleanup_failed` rows require monitoring and intervention if retries persist.

## Launch gate

Before production rollout, close the post-confirmation overwrite window and run browser-level upload/download/cancel tests across each intended provider pair, including CORS, URL expiry, corrupted bytes, an unavailable provider, partial delete retry, and multi-replica reservation concurrency on PostgreSQL. Exercise a large streamed download in a supported browser. Monitor cleanup backlog and reconcile provider objects against manifests. The current local emulator and unit tests do not prove real-provider behavior.
