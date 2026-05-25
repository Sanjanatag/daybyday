/** Same-origin /api on Vercel; override via VITE_API_BASE at build time if needed. */
const API_BASE = import.meta.env.VITE_API_BASE || '/api'

function apiUrl(path) {
  const base = API_BASE.replace(/\/$/, '')
  return `${base}${path}`
}

export async function fetchProfile(clientId) {
  const res = await fetch(apiUrl(`/profile/${clientId}`))
  if (res.status === 404) return null
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Failed to load profile (${res.status})`)
  }
  return res.json()
}

export async function saveProfile(clientId, snapshot) {
  const res = await fetch(apiUrl(`/profile/${clientId}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(snapshot),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Failed to save profile (${res.status})`)
  }
  return res.json()
}

export async function checkApiHealth() {
  const res = await fetch(apiUrl('/health'))
  return res.ok
}
