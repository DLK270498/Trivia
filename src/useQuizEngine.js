import { useEffect, useMemo, useRef, useState } from 'react'
import { applyAnswer, hasUnlockCredit, isDue, isMastered, isNew, makeInitialEntry } from './leitner.js'
import { loadProgress, saveProgress } from './api.js'
import { isFuzzyMatch } from './match.js'

const NEW_CARDS_PER_SESSION = 20
const REQUEUE_OFFSET = 5
const UNLOCK_KEY = '__unlockedTier'

function shuffle(array) {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function groupByTier(items) {
  const map = new Map()
  items.forEach((item) => {
    const tier = item.difficulty || 1
    if (!map.has(tier)) map.set(tier, [])
    map.get(tier).push(item)
  })
  return map
}

// Eine Stufe schaltet sich frei, sobald jedes ihrer Länder mindestens einmal
// richtig beantwortet wurde (siehe hasUnlockCredit) - bewusst unabhängig vom
// langsamen, tage-basierten Box-Fortschritt, damit sich eine Stufe an einem
// Tag durcharbeiten lässt. Einmal freigeschaltet, bleibt es das dauerhaft.
function computeUnlockedTier(progress, itemsByTier, maxTier) {
  let unlocked = Math.max(1, progress[UNLOCK_KEY] || 1)
  while (unlocked < maxTier) {
    const tierItems = itemsByTier.get(unlocked) || []
    const allUnlockCredit =
      tierItems.length > 0 &&
      tierItems.every((item) => hasUnlockCredit(progress[item.country] || makeInitialEntry()))
    if (!allUnlockCredit) break
    unlocked += 1
  }
  return unlocked
}

function buildQueue(items, progress, unlockedTier) {
  const now = Date.now()
  const due = []
  const fresh = []
  const unlockedPool = []

  items.forEach((item, i) => {
    if ((item.difficulty || 1) > unlockedTier) return
    unlockedPool.push(i)
    const entry = progress[item.country] || makeInitialEntry()
    if (isNew(entry)) {
      fresh.push(i)
    } else if (isDue(entry, now)) {
      due.push(i)
    }
  })

  const newSlice = shuffle(fresh).slice(0, NEW_CARDS_PER_SESSION)
  const queue = shuffle([...due, ...newSlice])

  // Wenn gerade nichts neu oder fällig ist, trotzdem eine Übungsrunde aus
  // bereits gesehenen (freigeschalteten) Ländern anbieten, statt den Nutzer
  // hängen zu lassen - Spaced Repetition soll nicht am mehrfachen Üben pro
  // Tag hindern.
  if (queue.length === 0 && unlockedPool.length > 0) {
    return shuffle(unlockedPool).slice(0, NEW_CARDS_PER_SESSION)
  }
  return queue
}

// Generischer Lern-Motor (Leitner-Wiederholung, Schwierigkeitsstufen-Freischaltung
// + Fuzzy-Bewertung), parametrisiert über Item-Liste, Speicher-Schlüssel und eine
// Funktion, die die richtige Antwort (+ Aliase) für ein Item liefert. So können
// mehrere Quiz-Modi (Hauptstädte, Flaggen, ...) dieselbe Logik mit getrenntem
// Fortschritt nutzen.
export function useQuizEngine({ storageKey, items, getAnswer, getAliases }) {
  const [progress, setProgress] = useState(null)
  const [queue, setQueue] = useState([])
  const [stage, setStage] = useState('ask') // 'ask' | 'reveal'
  const [guess, setGuess] = useState('')
  const [wasCorrect, setWasCorrect] = useState(false)
  const [sessionDone, setSessionDone] = useState(0)
  const [tierJustUnlocked, setTierJustUnlocked] = useState(null)
  const progressRef = useRef(progress)
  progressRef.current = progress

  const itemsByTier = useMemo(() => groupByTier(items), [items])
  const maxTier = useMemo(() => Math.max(...items.map((i) => i.difficulty || 1)), [items])

  useEffect(() => {
    loadProgress(storageKey).then((loaded) => {
      const unlocked = computeUnlockedTier(loaded, itemsByTier, maxTier)
      const withUnlock = { ...loaded, [UNLOCK_KEY]: unlocked }
      setProgress(withUnlock)
      setQueue(buildQueue(items, withUnlock, unlocked))
    })
    // items/itemsByTier/maxTier sind für die Lebensdauer der App statisch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey])

  const stats = useMemo(() => {
    if (!progress) return null
    let mastered = 0
    let learning = 0
    let fresh = 0
    items.forEach((item) => {
      const entry = progress[item.country] || makeInitialEntry()
      if (isNew(entry)) fresh++
      else if (isMastered(entry)) mastered++
      else learning++
    })
    return { total: items.length, mastered, learning, fresh }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress])

  const unlockedTier = progress ? progress[UNLOCK_KEY] || 1 : 1
  const currentIndex = queue[0]
  const current = currentIndex !== undefined ? items[currentIndex] : null
  const canSubmit = guess.trim().length > 0

  function persist(nextProgress) {
    const newUnlocked = computeUnlockedTier(nextProgress, itemsByTier, maxTier)
    const prevUnlocked = progressRef.current?.[UNLOCK_KEY] || 1
    const withUnlock = { ...nextProgress, [UNLOCK_KEY]: newUnlocked }
    if (newUnlocked > prevUnlocked) {
      setTierJustUnlocked(newUnlocked)
    }
    setProgress(withUnlock)
    saveProgress(storageKey, withUnlock)
    return withUnlock
  }

  function handleCheck() {
    if (!canSubmit || !current) return
    const correct = isFuzzyMatch(guess, getAnswer(current), getAliases(current))
    setWasCorrect(correct)
    setStage('reveal')
  }

  function handleDontKnow() {
    if (!current) return
    setWasCorrect(false)
    setStage('reveal')
  }

  function handleContinue(finalCorrect) {
    const key = current.country
    const entry = progressRef.current[key] || makeInitialEntry()
    const updated = applyAnswer(entry, finalCorrect)
    const nextProgress = persist({ ...progressRef.current, [key]: updated })

    const rest = queue.slice(1)
    let nextQueue
    if (finalCorrect) {
      nextQueue = rest
    } else {
      const insertAt = Math.min(rest.length, REQUEUE_OFFSET)
      nextQueue = [...rest.slice(0, insertAt), currentIndex, ...rest.slice(insertAt)]
    }
    // Falls sich gerade eine neue Stufe freigeschaltet hat, deren Karten mit einmischen.
    const refreshedUnlocked = nextProgress[UNLOCK_KEY] || 1
    if (refreshedUnlocked > unlockedTier) {
      const newlyUnlocked = shuffle(
        items
          .map((item, i) => [item, i])
          .filter(([item]) => (item.difficulty || 1) === refreshedUnlocked)
          .map(([, i]) => i),
      ).slice(0, NEW_CARDS_PER_SESSION)
      nextQueue = [...nextQueue, ...newlyUnlocked]
    }
    setQueue(nextQueue)
    setSessionDone((n) => n + (finalCorrect ? 1 : 0))
    setStage('ask')
    setGuess('')
  }

  function startNewSession() {
    setSessionDone(0)
    setQueue(buildQueue(items, progressRef.current, unlockedTier))
    setStage('ask')
    setGuess('')
  }

  function dismissTierUnlock() {
    setTierJustUnlocked(null)
  }

  return {
    ready: progress !== null,
    stats,
    queue,
    current,
    stage,
    guess,
    setGuess,
    wasCorrect,
    setWasCorrect,
    canSubmit,
    sessionDone,
    unlockedTier,
    maxTier,
    tierJustUnlocked,
    dismissTierUnlock,
    handleCheck,
    handleDontKnow,
    handleContinue,
    startNewSession,
  }
}
