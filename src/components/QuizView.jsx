import { useEffect } from 'react'

const TIER_LABELS = { 1: 'Stufe 1', 2: 'Stufe 2', 3: 'Stufe 3', 4: 'Stufe 4' }
const TIER_CLASSES = { 1: 'tier-1', 2: 'tier-2', 3: 'tier-3', 4: 'tier-4' }

// Stellt eine Lernrunde (Frage -> Eingabe -> Bewertung -> Auflösung) dar.
// Die konkreten Inhalte (Frage, Antwort, Zusatzinfos) kommen als Render-Props,
// damit derselbe Ablauf für mehrere Quiz-Modi (Hauptstädte, Flaggen, ...)
// wiederverwendet werden kann.
export default function QuizView({
  engine,
  promptText,
  inputPlaceholder,
  emptyTitle,
  emptyText,
  renderQuestion,
  renderRevealAnswer,
  renderRevealExtra,
}) {
  const {
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
  } = engine

  useEffect(() => {
    if (tierJustUnlocked == null) return undefined
    const timer = setTimeout(dismissTierUnlock, 3500)
    return () => clearTimeout(timer)
  }, [tierJustUnlocked, dismissTierUnlock])

  if (!stats) {
    return <div className="center-message">Lade Fortschritt…</div>
  }

  return (
    <>
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

      <div className="tier-progress">
        {Array.from({ length: maxTier }, (_, i) => i + 1).map((tier) => (
          <span
            key={tier}
            className={`tier-dot ${TIER_CLASSES[tier]} ${tier <= unlockedTier ? 'is-unlocked' : 'is-locked'}`}
          />
        ))}
        <span className="tier-progress-label">
          {TIER_LABELS[unlockedTier]} von {maxTier} freigeschaltet
        </span>
      </div>

      {tierJustUnlocked != null && (
        <div className="tier-toast" onClick={dismissTierUnlock}>
          🎉 {TIER_LABELS[tierJustUnlocked]} freigeschaltet!
        </div>
      )}

      <main className="card-area">
        {!current ? (
          <div className="card center-message">
            <h2>{emptyTitle}</h2>
            <p>{emptyText}</p>
            <button className="primary" onClick={startNewSession}>Neue Runde starten</button>
          </div>
        ) : (
          <div className="card" key={current.country}>
            <div className="card-tags">
              <span className="region-tag">{current.region}</span>
              <span className={`difficulty-tag ${TIER_CLASSES[current.difficulty || 1]}`}>
                {TIER_LABELS[current.difficulty || 1]}
              </span>
            </div>

            {stage === 'ask' && (
              <>
                {renderQuestion(current)}
                <p className="prompt">{promptText}</p>
                <input
                  className="guess-input"
                  type="text"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  placeholder={inputPlaceholder}
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
                {renderRevealAnswer(current)}
                {renderRevealExtra(current)}

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
    </>
  )
}
