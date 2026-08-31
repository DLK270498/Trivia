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
    handleCheck,
    handleDontKnow,
    handleContinue,
    startNewSession,
  } = engine

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

      <main className="card-area">
        {!current ? (
          <div className="card center-message">
            <h2>{emptyTitle}</h2>
            <p>{emptyText}</p>
            <button className="primary" onClick={startNewSession}>Neue Runde starten</button>
          </div>
        ) : (
          <div className="card" key={current.country}>
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
