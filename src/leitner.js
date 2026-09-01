// Klassisches Leitner-Karteikasten-System mit 5 Boxen.
// Box 1 = frisch/falsch beantwortet (kommt bald wieder dran),
// Box 5 = sehr gut bekannt (wird selten wiederholt).
export const MAX_BOX = 5

// Intervall in Tagen, bis eine Karte aus dieser Box erneut fällig wird.
const BOX_INTERVAL_DAYS = {
  1: 0, // sofort wieder in derselben Session fällig
  2: 1,
  3: 3,
  4: 7,
  5: 14,
}

const DAY_MS = 24 * 60 * 60 * 1000

export function makeInitialEntry() {
  return { box: 1, dueAt: 0, seenCount: 0, correctStreak: 0, unlockCredit: false }
}

export function isDue(entry, now = Date.now()) {
  return entry.dueAt <= now
}

export function isNew(entry) {
  return entry.seenCount === 0
}

// Echtes Langzeit-"Gelernt" - braucht mehrere richtige Antworten, verteilt
// über die Box-Intervalle (Tage). Das ist absichtlich langsam.
export function isMastered(entry) {
  return entry.box === MAX_BOX && entry.correctStreak >= 2
}

// Leichtgewichtige Freischalt-Bedingung für Schwierigkeitsstufen: reicht schon,
// wenn eine Karte irgendwann mal richtig beantwortet wurde - unabhängig vom
// langsamen Box-Fortschritt, damit sich eine Stufe auch an einem einzigen Tag
// durcharbeiten lässt. Bestehender Fortschritt (box > 1 oder ein alter
// correctStreak) zählt rückwirkend, damit niemand wegen eines fehlenden Felds
// von vorne anfangen muss.
export function hasUnlockCredit(entry) {
  return !!entry.unlockCredit || entry.box > 1 || entry.correctStreak > 0
}

export function applyAnswer(entry, knewIt, now = Date.now()) {
  const seenCount = entry.seenCount + 1
  if (knewIt) {
    const box = Math.min(MAX_BOX, entry.box + 1)
    const correctStreak = entry.correctStreak + 1
    const dueAt = now + BOX_INTERVAL_DAYS[box] * DAY_MS
    return { box, dueAt, seenCount, correctStreak, unlockCredit: true }
  }
  const box = 1
  // Falsch beantwortete Karten kommen nach kurzer Zeit in derselben Session wieder dran.
  const dueAt = now + 2 * 60 * 1000
  return { box, dueAt, seenCount, correctStreak: 0, unlockCredit: entry.unlockCredit || false }
}

export function pickNextIndex(entries, now = Date.now()) {
  const dueIndices = entries
    .map((e, i) => [e, i])
    .filter(([e]) => isDue(e, now))

  if (dueIndices.length === 0) return -1

  // Neue Karten (noch nie gesehen) zuerst, danach nach Fälligkeit sortiert.
  dueIndices.sort(([a], [b]) => {
    if (isNew(a) !== isNew(b)) return isNew(a) ? -1 : 1
    return a.dueAt - b.dueAt
  })

  return dueIndices[0][1]
}
