export async function loadProgress(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function saveProgress(key, progress) {
  try {
    localStorage.setItem(key, JSON.stringify(progress))
  } catch {
    // localStorage full or unavailable (e.g. private browsing) - progress just won't persist.
  }
}
