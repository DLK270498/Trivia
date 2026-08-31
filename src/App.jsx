import { useEffect, useMemo, useRef, useState } from 'react'
import capitals from './data/capitals.json'
import { applyAnswer, isDue, isMastered, isNew, makeInitialEntry } from './leitner.js'
import { loadProgress, saveProgress } from './api.js'

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
    return <div className="center-message">Lade Fortschritt…</div>
  }

  const currentIndex = queue[0]
  const current = currentIndex !== undefined ? capitals[currentIndex] : null

  function persist(nextProgress) {
    setProgress(nextProgress)
    saveProgress(nextProgress)
  }

  function handleReveal() {
    setStage('reveal')
  }

  function handleAnswer(knewIt) {
    const country = current.country
    const entry = progressRef.current[country] || makeInitialEntry()
    const updated = applyAnswer(entry, knewIt)
    persist({ ...progressRef.current, [country]: updated })

    const rest = queue.slice(1)
    if (knewIt) {
      setQueue(rest)
    } else {
      const insertAt = Math.min(rest.length, REQUEUE_OFFSET)
      const nextQueue = [...rest.slice(0, insertAt), currentIndex, ...rest.slice(insertAt)]
      setQueue(nextQueue)
    }
    setSessionDone((n) => n + (knewIt ? 1 : 0))
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
      <header className="stats-bar">
        <span>🌍 {stats.total} Länder</span>
        <span className="stat-mastered">✅ {stats.mastered} gelernt</span>
        <span className="stat-learning">📚 {stats.learning} in Übung</span>
        <span className="stat-fresh">🆕 {stats.fresh} neu</span>
      </header>

      <main className="card-area">
        {!current ? (
          <div className="center-message">
            <h2>Für jetzt fertig! 🎉</h2>
            <p>Aktuell ist keine Hauptstadt fällig. Schau später wieder vorbei, oder starte eine neue Runde.</p>
            <button className="primary" onClick={startNewSession}>Neue Runde starten</button>
          </div>
        ) : (
          <div className="card">
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
                  placeholder="Deine Antwort (optional)"
                  onKeyDown={(e) => e.key === 'Enter' && handleReveal()}
                  autoFocus
                />
                <button className="primary" onClick={handleReveal}>Antwort zeigen</button>
              </>
            )}

            {stage === 'reveal' && (
              <>
                <p className="capital-answer">{current.capital}</p>
                {guess && (
                  <p className="your-guess">Deine Antwort: <em>{guess}</em></p>
                )}
                <ul className="facts">
                  {current.facts.map((fact, i) => (
                    <li key={i}>{fact}</li>
                  ))}
                </ul>
                <p className="prompt">Wusstest du es?</p>
                <div className="answer-buttons">
                  <button className="no" onClick={() => handleAnswer(false)}>❌ Nicht gewusst</button>
                  <button className="yes" onClick={() => handleAnswer(true)}>✅ Gewusst</button>
                </div>
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
