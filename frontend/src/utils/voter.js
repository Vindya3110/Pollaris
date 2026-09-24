// Generate a unique voter ID for this browser and persist it.
// Each browser/incognito window gets its own ID, so users are properly
// distinguished even when they share the same machine and IP address.

const STORAGE_KEY = 'pollaris_voter_id'

export function getVoterID() {
  let id = localStorage.getItem(STORAGE_KEY)

  if (!id) {
    // Generate a random voter ID
    id = 'v_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10)
    localStorage.setItem(STORAGE_KEY, id)
  }

  return id
}
