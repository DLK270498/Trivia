export async function loadProgress() {
  try {
    const res = await fetch('/api/progress')
    if (!res.ok) return {}
    return await res.json()
  } catch {
    return {}
  }
}

let saveTimer = null

export function saveProgress(progress) {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(progress),
    }).catch(() => {})
  }, 300)
}
