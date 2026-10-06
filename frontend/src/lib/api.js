/**
 * api.js — single API client for the NexusCloud backend.
 *
 * Contract rules implemented here (docs/API_CONTRACT_AND_FRONTEND.md):
 * - Base path /api/v1, JSON bodies, Bearer access tokens.
 * - Tokens live in memory only (never localStorage / URLs).
 * - Error envelope: { error: { code, message, details? } }.
 * - 401 -> one coordinated refresh, retry original request once,
 *   otherwise clear auth and dispatch `nexus:unauthorized`.
 * - 429 -> message derived from Retry-After header when present.
 */

import { API_URL } from '../config';

const BASE = `${API_URL}/api/v1`;

let accessToken = null;
let refreshToken = null;
let refreshPromise = null;

export function setTokens(tokens) {
  accessToken = tokens?.access_token ?? null;
  refreshToken = tokens?.refresh_token ?? null;
}

export function getAccessToken() {
  return accessToken;
}

export function hasSession() {
  return Boolean(accessToken && refreshToken);
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  refreshPromise = null;
}

export class ApiError extends Error {
  constructor(status, code, message, details, requestId) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details || [];
    this.requestId = requestId || null;
  }
}

function messageFor(status) {
  switch (status) {
    case 400: return 'The request was invalid.';
    case 401: return 'Your session has expired. Please sign in again.';
    case 403: return 'You do not have permission to do that.';
    case 404: return 'The requested resource was not found.';
    case 409: return 'That action conflicts with the current state.';
    case 411: return 'The request was rejected by the server (length required).';
    case 413: return 'The request body is too large.';
    case 422: return 'Please review the highlighted fields.';
    case 429: return 'Too many requests. Please wait a moment and try again.';
    case 502: return 'The upstream cloud provider could not be reached.';
    default: return 'Something went wrong. Please try again.';
  }
}

async function parseError(res) {
  let payload = null;
  try {
    payload = await res.json();
  } catch {
    /* non-JSON body */
  }

  const requestId = res.headers.get('X-Request-ID');
  const envelope = payload?.error;
  let message = envelope?.message || payload?.detail || messageFor(res.status);
  let details = envelope?.details || null;

  // FastAPI validation errors arrive as { detail: [{loc, msg}, ...] }.
  if (Array.isArray(payload?.detail) && !details) {
    details = payload.detail.map((d) => ({
      field: Array.isArray(d.loc) ? d.loc.filter((p) => p !== 'body').join('.') : undefined,
      message: d.msg,
    }));
    message = messageFor(res.status);
  }

  if (res.status === 429) {
    const retryAfter = res.headers.get('Retry-After');
    if (retryAfter && !envelope?.message) {
      message = `Rate limit reached. Try again in ${retryAfter} seconds.`;
    }
  }

  return new ApiError(res.status, envelope?.code || 'error', message, details, requestId);
}

async function attemptRefresh() {
  if (!refreshToken) return false;
  if (!refreshPromise) {
    refreshPromise = fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) return false;
        const tokens = await res.json();
        setTokens(tokens); // rotation: old refresh token is now invalid
        return true;
      })
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

function forceLogout() {
  clearTokens();
  window.dispatchEvent(new Event('nexus:unauthorized'));
}

/**
 * @param {string} path     path relative to /api/v1, e.g. '/files'
 * @param {object} options  fetch options; `body` is JSON-stringified,
 *                          `auth: false` skips the Bearer header.
 */
export async function api(path, options = {}) {
  const { auth = true, headers, body, ...rest } = options;

  const finalHeaders = { ...(headers || {}) };
  if (body !== undefined) finalHeaders['Content-Type'] = 'application/json';
  if (auth && accessToken) finalHeaders.Authorization = `Bearer ${accessToken}`;

  const exec = () =>
    fetch(`${BASE}${path}`, {
      ...rest,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  let res;
  try {
    res = await exec();
  } catch {
    throw new ApiError(0, 'network', 'Cannot reach the NexusCloud API. Check that the backend is running.');
  }

  if (res.status === 401 && auth) {
    const refreshed = await attemptRefresh();
    if (refreshed) {
      finalHeaders.Authorization = `Bearer ${accessToken}`;
      try {
        res = await exec();
      } catch {
        throw new ApiError(0, 'network', 'Cannot reach the NexusCloud API.');
      }
    } else {
      forceLogout();
      throw new ApiError(401, 'unauthorized', messageFor(401));
    }
  }

  if (res.status === 204) return null;
  if (!res.ok) throw await parseError(res);

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

/* ------------------------------------------------------------------ */
/* Endpoint wrappers                                                   */
/* ------------------------------------------------------------------ */

export const authApi = {
  register: (payload) => api('/auth/register', { method: 'POST', body: payload, auth: false }),
  login: (payload) => api('/auth/login', { method: 'POST', body: payload, auth: false }),
  refresh: (token) =>
    api('/auth/refresh', { method: 'POST', body: { refresh_token: token }, auth: false }),
  logout: () => api('/auth/logout', { method: 'POST' }),
  me: () => api('/auth/me'),
  forgotPassword: (email) =>
    api('/auth/forgot-password', { method: 'POST', body: { email }, auth: false }),
  resetPassword: (payload) =>
    api('/auth/reset-password', { method: 'POST', body: payload, auth: false }),
  changePassword: (payload) => api('/auth/change-password', { method: 'POST', body: payload }),
  setPlan: (plan) => api('/auth/plan', { method: 'POST', body: { plan } }),
  auditLogs: () => api('/auth/audit-logs'),
};

export const catalogApi = {
  providers: () => api('/providers', { auth: false }),
  plans: () => api('/plans', { auth: false }),
};

export const connectionApi = {
  list: () => api('/connections'),
  create: (payload) => api('/connections', { method: 'POST', body: payload }),
  remove: (id) => api(`/connections/${id}`, { method: 'DELETE' }),
};

export const fileApi = {
  list: () => api('/files'),
  uploadRequest: (payload) => api('/files/upload-request', { method: 'POST', body: payload }),
  confirmUpload: (fileId) => api(`/files/confirm-upload/${fileId}`, { method: 'POST' }),
  download: (fileId) => api(`/files/download/${fileId}`),
  remove: (fileId) => api(`/files/${fileId}`, { method: 'DELETE' }),
};

export const quotaApi = {
  summary: () => api('/quota/summary'),
};

/**
 * PUT the raw file bytes straight to the signed upload URL.
 * Every `required_headers` entry is applied verbatim; the NexusCloud
 * bearer token is deliberately NOT sent to the cloud host.
 */
export function uploadToSignedUrl({ uploadUrl, requiredHeaders, file, onProgress }) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    Object.entries(requiredHeaders || {}).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload to cloud storage failed (HTTP ${xhr.status}). Check the bucket CORS policy.`));
    };
    xhr.onerror = () =>
      reject(new Error('Network error during transfer. Check the bucket CORS policy for this origin.'));
    xhr.send(file);
  });
}
