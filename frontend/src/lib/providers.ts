import type { ProviderId } from "../types/api"

export interface ProviderMeta {
  id: ProviderId
  /** Canonical product name. */
  name: string
  /** Short mark used in compact rows. */
  short: string
  /** Restrained identity hue — used only for the small provider marker. */
  marker: string
  /** True when the backend requires `region`. */
  regionRequired: boolean
  /** Human hint for the region field, when required or optional. */
  regionHint: string | null
  bucketLabel: string
  bucketHint: string
  credentials: CredentialField[]
}

export interface CredentialField {
  key: string
  label: string
  hint: string
  secret: boolean
  /** Placeholder must never look like a real credential. */
  placeholder: string
}

export const PROVIDER_META: Record<ProviderId, ProviderMeta> = {
  aws: {
    id: "aws",
    name: "AWS S3",
    short: "AWS",
    marker: "#D97706",
    regionRequired: true,
    regionHint: "AWS region, e.g. us-east-1",
    bucketLabel: "Bucket name",
    bucketHint: "The S3 bucket uploads will be placed in",
    credentials: [
      {
        key: "aws_access_key_id",
        label: "Access key ID",
        hint: "IAM access key scoped to the bucket",
        secret: false,
        placeholder: "AKIA…",
      },
      {
        key: "aws_secret_access_key",
        label: "Secret access key",
        hint: "Stored encrypted; never displayed again",
        secret: true,
        placeholder: "••••••••••••••••",
      },
    ],
  },
  azure: {
    id: "azure",
    name: "Azure Blob",
    short: "Azure",
    marker: "#0369A1",
    regionRequired: false,
    regionHint: "Optional",
    bucketLabel: "Container name",
    bucketHint: "The storage container uploads will be placed in",
    credentials: [
      {
        key: "account_name",
        label: "Storage account name",
        hint: "The account that owns the container",
        secret: false,
        placeholder: "storageaccount",
      },
      {
        key: "account_key",
        label: "Account key",
        hint: "Stored encrypted; never displayed again",
        secret: true,
        placeholder: "••••••••••••••••",
      },
    ],
  },
  gcp: {
    id: "gcp",
    name: "Google Cloud Storage",
    short: "GCS",
    marker: "#1A73E8",
    regionRequired: false,
    regionHint: "Optional",
    bucketLabel: "Bucket name",
    bucketHint: "The GCS bucket uploads will be placed in",
    credentials: [
      {
        key: "service_account_json",
        label: "Service account JSON",
        hint: "Full JSON key, pasted as text. Stored encrypted",
        secret: true,
        placeholder: "{ … }",
      },
    ],
  },
  r2: {
    id: "r2",
    name: "Cloudflare R2",
    short: "R2",
    marker: "#C2570F",
    regionRequired: false,
    regionHint: "Optional",
    bucketLabel: "Bucket name",
    bucketHint: "The R2 bucket uploads will be placed in",
    credentials: [
      {
        key: "aws_access_key_id",
        label: "Access key ID",
        hint: "R2 API token access key",
        secret: false,
        placeholder: "32-character key",
      },
      {
        key: "aws_secret_access_key",
        label: "Secret access key",
        hint: "R2 API token secret. Stored encrypted",
        secret: true,
        placeholder: "••••••••••••••••",
      },
      {
        key: "account_id",
        label: "Account ID",
        hint: "32 hexadecimal characters from the Cloudflare dashboard",
        secret: false,
        placeholder: "32 hex characters",
      },
    ],
  },
  b2: {
    id: "b2",
    name: "Backblaze B2",
    short: "B2",
    marker: "#B02A30",
    regionRequired: true,
    regionHint: "B2 S3 region, e.g. us-west-004",
    bucketLabel: "Bucket name",
    bucketHint: "The B2 bucket uploads will be placed in",
    credentials: [
      {
        key: "aws_access_key_id",
        label: "Key ID",
        hint: "Application key ID",
        secret: false,
        placeholder: "Application key ID",
      },
      {
        key: "aws_secret_access_key",
        label: "Application key",
        hint: "Stored encrypted; never displayed again",
        secret: true,
        placeholder: "••••••••••••••••",
      },
    ],
  },
  oracle: {
    id: "oracle",
    name: "Oracle Cloud",
    short: "OCI",
    marker: "#C74634",
    regionRequired: true,
    regionHint: "OCI region, e.g. us-ashburn-1",
    bucketLabel: "Bucket name",
    bucketHint: "The OCI bucket uploads will be placed in",
    credentials: [
      {
        key: "tenancy_id",
        label: "Tenancy OCID",
        hint: "ocid1.tenancy.oc1…",
        secret: false,
        placeholder: "ocid1.tenancy.oc1…",
      },
      {
        key: "user_id",
        label: "User OCID",
        hint: "ocid1.user.oc1…",
        secret: false,
        placeholder: "ocid1.user.oc1…",
      },
      {
        key: "fingerprint",
        label: "API key fingerprint",
        hint: "Fingerprint of the signing key",
        secret: false,
        placeholder: "aa:bb:cc:…",
      },
      {
        key: "private_key",
        label: "Private key (PEM)",
        hint: "Signing key in PEM form. Stored encrypted",
        secret: true,
        placeholder: "-----BEGIN PRIVATE KEY-----",
      },
      {
        key: "namespace",
        label: "Object storage namespace",
        hint: "Found under Object Storage settings",
        secret: false,
        placeholder: "namespace",
      },
    ],
  },
  ibm: {
    id: "ibm",
    name: "IBM Cloud",
    short: "IBM",
    marker: "#0F62FE",
    regionRequired: true,
    regionHint: "IBM COS region, e.g. us-south",
    bucketLabel: "Bucket name",
    bucketHint: "The COS bucket uploads will be placed in",
    credentials: [
      {
        key: "aws_access_key_id",
        label: "Access key ID",
        hint: "HMAC credentials access key",
        secret: false,
        placeholder: "Access key ID",
      },
      {
        key: "aws_secret_access_key",
        label: "Secret access key",
        hint: "HMAC credentials secret. Stored encrypted",
        secret: true,
        placeholder: "••••••••••••••••",
      },
    ],
  },
}

export const PROVIDER_IDS = Object.keys(PROVIDER_META) as ProviderId[]

/**
 * Backend routing weights (app/services/router.py). Shown verbatim on the
 * landing page and Router screen — the frontend never recomputes decisions.
 */
export const ROUTE_WEIGHTS = [
  { key: "capacity", label: "Free capacity", weight: 0.4 },
  { key: "egress", label: "Egress cost", weight: 0.3 },
  { key: "permanence", label: "Tier permanence", weight: 0.2 },
  { key: "fit", label: "File-to-quota fit", weight: 0.1 },
] as const

export function providerName(id: string): string {
  return PROVIDER_META[id as ProviderId]?.name ?? id
}
