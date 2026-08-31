import { useEffect, useMemo, useRef, useState } from 'react'
import capitals from './data/capitals.json'
import { applyAnswer, isDue, isMastered, isNew, makeInitialEntry } from './leitner.js'
import { loadProgress, saveProgress } from './api.js'
import { isFuzzyMatch } from './match.js'
import GlobeBackground from './components/GlobeBackground.jsx'

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

function buildQueue(progress) {
  const now = Date.now()
  const due = []
  const fresh = []

  capitals.forEach((c, i) => {
    const entry = progress[c.country] || makeInitialEntry()
    if (isNew(entry)) {
      fresh.push(i)
    } else if (isDue(entry, now)) {
      due.push(i)
    }
  })

  const newSlice = shuffle(fresh).slice(0, NEW_CARDS_PER_SESSION)
  return shuffle([...due, ...newSlice])
}

export default function App() {
  const [progress, setProgress] = useState(null)
  const [queue, setQueue] = useState([])
  const [stage, setStage] = useState('ask') // 'ask' | 'reveal'
  const [guess, setGuess] = useState('')
  const [wasCorrect, setWasCorrect] = useState(false)
  const [sessionDone, setSessionDone] = useState(0)
  const progressRef = useRef(progress)
  progressRef.current = progress

  useEffect(() => {
    loadProgress().then((loaded) => {
      setProgress(loaded)
      setQueue(buildQueue(loaded))
    })
  }, [])

  const stats = useMemo(() => {
    if (!progress) return null
    let mastered = 0
    let learning = 0
    let fresh = 0
    capitals.forEach((c) => {
      const entry = progress[c.country] || makeInitialEntry()
      if (isNew(entry)) fresh++
      else if (isMastered(entry)) mastered++
      else learning++
    })
    return { total: capitals.length, mastered, learning, fresh }
  }, [progress])

  if (!progress) {
    return (
      <div className="app">
        <GlobeBackground />
        <div className="center-message">Lade Fortschritt…</div>
      </div>
    )
  }

  const currentIndex = queue[0]
  const current = currentIndex !== undefined ? capitals[currentIndex] : null
  const canSubmit = guess.trim().length > 0

  function persist(nextProgress) {
    setProgress(nextProgress)
    saveProgress(nextProgress)
  }

  function handleCheck() {
    if (!canSubmit) return
    const correct = isFuzzyMatch(guess, current.capital, current.aliases || [])
    setWasCorrect(correct)
    setStage('reveal')
  }

  function handleDontKnow() {
    setWasCorrect(false)
    setStage('reveal')
  }

  function handleContinue(finalCorrect) {
    const country = current.country
    const entry = progressRef.current[country] || makeInitialEntry()
    const updated = applyAnswer(entry, finalCorrect)
    persist({ ...progressRef.current, [country]: updated })

    const rest = queue.slice(1)
    if (finalCorrect) {
      setQueue(rest)
    } else {
      const insertAt = Math.min(rest.length, REQUEUE_OFFSET)
      const nextQueue = [...rest.slice(0, insertAt), currentIndex, ...rest.slice(insertAt)]
      setQueue(nextQueue)
    }
    setSessionDone((n) => n + (finalCorrect ? 1 : 0))
    setStage('ask')
    setGuess('')
  }

  function startNewSession() {
    setSessionDone(0)
    setQueue(buildQueue(progressRef.current))
    setStage('ask')
    setGuess('')
  }

  return (
    <div className="app">
      <GlobeBackground />

      <header className="stats-bar">
        <div className="stat">
          <span className="stat-value">{stats.total}</span>
          <span className="stat-label">Länder</span>
        </div>
        <div className="stat stat-mastered">
          <span className="stat-value">{stats.mastered}</span>
          <span className="stat-label">Gelernt</span>
        </div>
        <div className="stat stat-learning">
          <span className="stat-value">{stats.learning}</span>
          <span className="stat-label">In Übung</span>
        </div>
        <div className="stat stat-fresh">
          <span className="stat-value">{stats.fresh}</span>
          <span className="stat-label">Neu</span>
        </div>
      </header>

      <main className="card-area">
        {!current ? (
          <div className="card center-message">
            <h2>Für jetzt fertig 🎉</h2>
            <p>Aktuell ist keine Hauptstadt fällig. Schau später wieder vorbei, oder starte eine neue Runde.</p>
            <button className="primary" onClick={startNewSession}>Neue Runde starten</button>
          </div>
        ) : (
          <div className="card" key={currentIndex}>
            <div className="region-tag">{current.region}</div>
            <h1>{current.country}</h1>

            {stage === 'ask' && (
              <>
                <p className="prompt">Wie heißt die Hauptstadt?</p>
                <input
                  className="guess-input"
                  type="text"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  placeholder="Deine Antwort"
                  onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                  autoFocus
                  autoCapitalize="words"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                />
                <button className="primary" onClick={handleCheck} disabled={!canSubmit}>
                  Antwort prüfen
                </button>
                <button className="secondary" onClick={handleDontKnow}>
                  Weiß ich nicht
                </button>
              </>
            )}

            {stage === 'reveal' && (
              <>
                <div className={`result-badge ${wasCorrect ? 'is-correct' : 'is-wrong'}`}>
                  {wasCorrect ? '✓ Richtig' : '✕ Nicht ganz'}
                </div>
                {guess.trim() ? (
                  <p className="your-guess">Deine Antwort: <em>{guess}</em></p>
                ) : (
                  <p className="your-guess">Direkt zur Antwort gesprungen</p>
                )}
                <p className="capital-answer">{current.capital}</p>
                <ul className="facts">
                  {current.facts.map((fact, i) => (
                    <li key={i}>{fact}</li>
                  ))}
                </ul>

                <button className="primary" onClick={() => handleContinue(wasCorrect)}>
                  Weiter
                </button>
                <button className="override-link" onClick={() => setWasCorrect((v) => !v)}>
                  {wasCorrect ? 'War eigentlich falsch?' : 'War eigentlich richtig?'}
                </button>
              </>
            )}
          </div>
        )}
      </main>

      {current && (
        <footer className="queue-info">
          Noch {queue.length} Karte{queue.length === 1 ? '' : 'n'} in dieser Runde · {sessionDone} richtig beantwortet
        </footer>
      )}
    </div>
  )
}
