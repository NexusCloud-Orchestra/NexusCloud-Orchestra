export type AuditGroup = "files" | "clouds" | "account"

/** Human labels and filter group for each backend audit action. */
export const AUDIT_EVENTS: Record<string, { label: string; group: AuditGroup }> = {
  UPLOAD: { label: "Upload completed", group: "files" },
  UPLOAD_REQUEST: { label: "Upload slot requested", group: "files" },
  UPLOAD_CANCEL: { label: "Upload cancelled", group: "files" },
  DOWNLOAD: { label: "Download issued", group: "files" },
  DELETE: { label: "File deleted", group: "files" },
  CONNECT: { label: "Cloud connected", group: "clouds" },
  DISCONNECT: { label: "Cloud disconnected", group: "clouds" },
  LOGIN: { label: "Signed in", group: "account" },
  LOGOUT: { label: "Signed out", group: "account" },
  REGISTER: { label: "Account created", group: "account" },
  PASSWORD_CHANGE: { label: "Password changed", group: "account" },
  PASSWORD_RESET: { label: "Password reset", group: "account" },
  PLAN_CHANGE: { label: "Plan changed", group: "account" },
}

export function auditLabel(action: string): string {
  return AUDIT_EVENTS[action]?.label ?? action
}

export function auditGroup(action: string): AuditGroup {
  return AUDIT_EVENTS[action]?.group ?? "account"
}
