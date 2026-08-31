import { useEffect, useMemo, useRef, useState } from 'react'
import { applyAnswer, isDue, isMastered, isNew, makeInitialEntry } from './leitner.js'
import { loadProgress, saveProgress } from './api.js'
import { isFuzzyMatch } from './match.js'

const NEW_CARDS_PER_SESSION = 20
const REQUEUE_OFFSET = 5

function shuffle(array) {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function buildQueue(items, progress) {
  const now = Date.now()
  const due = []
  const fresh = []

  items.forEach((item, i) => {
    const entry = progress[item.country] || makeInitialEntry()
    if (isNew(entry)) {
      fresh.push(i)
    } else if (isDue(entry, now)) {
      due.push(i)
    }
  })

  const newSlice = shuffle(fresh).slice(0, NEW_CARDS_PER_SESSION)
  return shuffle([...due, ...newSlice])
}

// Generischer Lern-Motor (Leitner-Wiederholung + Fuzzy-Bewertung), parametrisiert
// über Item-Liste, Speicher-Schlüssel und eine Funktion, die die richtige Antwort
// (+ Aliase) für ein Item liefert. So können mehrere Quiz-Modi (Hauptstädte,
// Flaggen, ...) dieselbe Logik mit getrenntem Fortschritt nutzen.
export function useQuizEngine({ storageKey, items, getAnswer, getAliases }) {
  const [progress, setProgress] = useState(null)
  const [queue, setQueue] = useState([])
  const [stage, setStage] = useState('ask') // 'ask' | 'reveal'
  const [guess, setGuess] = useState('')
  const [wasCorrect, setWasCorrect] = useState(false)
  const [sessionDone, setSessionDone] = useState(0)
  const progressRef = useRef(progress)
  progressRef.current = progress

  useEffect(() => {
    loadProgress(storageKey).then((loaded) => {
      setProgress(loaded)
      setQueue(buildQueue(items, loaded))
    })
    // items ist für die Lebensdauer der App statisch, storageKey ist der eigentliche Schlüssel.
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

  const currentIndex = queue[0]
  const current = currentIndex !== undefined ? items[currentIndex] : null
  const canSubmit = guess.trim().length > 0

  function persist(nextProgress) {
    setProgress(nextProgress)
    saveProgress(storageKey, nextProgress)
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
    persist({ ...progressRef.current, [key]: updated })

    const rest = queue.slice(1)
    let nextQueue
    if (finalCorrect) {
      nextQueue = rest
    } else {
      const insertAt = Math.min(rest.length, REQUEUE_OFFSET)
      nextQueue = [...rest.slice(0, insertAt), currentIndex, ...rest.slice(insertAt)]
    }
    setQueue(nextQueue)
    setSessionDone((n) => n + (finalCorrect ? 1 : 0))
    setStage('ask')
    setGuess('')
  }

  function startNewSession() {
    setSessionDone(0)
    setQueue(buildQueue(items, progressRef.current))
    setStage('ask')
    setGuess('')
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
    handleCheck,
    handleDontKnow,
    handleContinue,
    startNewSession,
  }
}
