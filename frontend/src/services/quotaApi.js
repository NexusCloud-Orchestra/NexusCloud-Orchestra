/**
 * quotaApi.js — API service for the Quota Engine backend.
 *
 * All fetch calls to the FastAPI backend live here.
 * Components import functions from this file instead of writing
 * fetch() calls directly in JSX, which keeps components clean and
 * makes it easy to swap the base URL or add auth headers later.
 *
 * Base URL is read from VITE_API_URL (set in .env).
 * Falls back to http://127.0.0.1:8000 if the variable is missing.
 */

import { API_URL } from '../config';

// ---------------------------------------------------------------------------
// GET /quota/{user_id}/summary
// ---------------------------------------------------------------------------
// Returns the quota summary for a user.
//
// Successful response shape (from QuotaSummary schema):
// {
//   user_id:           number,   // e.g. 1
//   total_storage:     number,   // bytes
//   used_storage:      number,   // bytes
//   remaining_storage: number,   // bytes
//   usage_percentage:  number,   // 0–100, e.g. 30.0
// }
//
// Throws an Error on HTTP errors or network failures so the caller
// can display an appropriate error state to the user.
// ---------------------------------------------------------------------------
export async function getQuotaSummary(userId) {
  const url = `${API_URL}/quota/${userId}/summary`;

  let response;
  try {
    response = await fetch(url);
  } catch (networkError) {
    // fetch() itself throws when the server is unreachable (no network, CORS
    // pre-flight failure, backend not running, etc.)
    throw new Error(
      'Cannot reach the Quota Engine API. ' +
      'Make sure the FastAPI server is running at ' + API_URL + '.'
    );
  }

  if (!response.ok) {
    // Parse the FastAPI error body if possible for a clear message.
    let detail = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      detail = body.detail || detail;
    } catch (_) {
      // Body was not JSON — use the status text.
      detail = response.statusText || detail;
    }
    throw new Error(detail);
  }

  return response.json(); // Resolves to the QuotaSummary object.
}

// ---------------------------------------------------------------------------
// GET /users/{user_id}
// ---------------------------------------------------------------------------
// Returns basic user info. Used by the dashboard to show the user's name.
//
// Response shape (UserResponse):
// { id, name, email, created_at }
// ---------------------------------------------------------------------------
export async function getUser(userId) {
  const url = `${API_URL}/users/${userId}`;

  let response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error('Cannot reach the Quota Engine API.');
  }

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      detail = body.detail || detail;
    } catch (_) {/* ignore */}
    throw new Error(detail);
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// GET /files/{user_id}
// ---------------------------------------------------------------------------
// Returns all file records for a user.
// Response: array of FileResponse objects.
// ---------------------------------------------------------------------------
export async function getUserFiles(userId) {
  const url = `${API_URL}/files/${userId}`;

  let response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error('Cannot reach the Quota Engine API.');
  }

  if (!response.ok) {
    // If the user has no quota yet the endpoint still returns a 200 with [].
    // A 404 here most likely means the user does not exist.
    let detail = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      detail = body.detail || detail;
    } catch (_) {/* ignore */}
    throw new Error(detail);
  }

  return response.json(); // Array of file objects.
}
