const CLIENT_ID_KEY = 'streak-habits-client-id'

function randomId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '')
  }
  return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`
}

/** Stable id for this browser — links all MongoDB saves for this install. */
export function getClientId() {
  let id = localStorage.getItem(CLIENT_ID_KEY)
  if (!id || id.length < 8) {
    id = randomId()
    localStorage.setItem(CLIENT_ID_KEY, id)
  }
  return id
}
