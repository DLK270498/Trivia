import { useState } from 'react'
import capitals from './data/capitals.json'
import { useQuizEngine } from './useQuizEngine.js'
import { flagEmoji } from './flags.js'
import GlobeBackground from './components/GlobeBackground.jsx'
import TabBar from './components/TabBar.jsx'
import QuizView from './components/QuizView.jsx'

export default function App() {
  const [tab, setTab] = useState('capitals')

  const capitalsEngine = useQuizEngine({
    storageKey: 'capitals-progress',
    items: capitals,
    getAnswer: (item) => item.capital,
    getAliases: (item) => item.aliases || [],
  })

  const flagsEngine = useQuizEngine({
    storageKey: 'flags-progress',
    items: capitals,
    getAnswer: (item) => item.country,
    getAliases: (item) => item.countryAliases || [],
  })

  return (
    <div className="app">
      <GlobeBackground />

      {tab === 'capitals' && (
        <QuizView
          engine={capitalsEngine}
          promptText="Wie heißt die Hauptstadt?"
          inputPlaceholder="Deine Antwort"
          emptyTitle="Für jetzt fertig 🎉"
          emptyText="Aktuell ist keine Hauptstadt fällig. Schau später wieder vorbei, oder starte eine neue Runde."
          renderQuestion={(item) => <h1>{item.country}</h1>}
          renderRevealAnswer={(item) => (
            <p className="capital-answer">{item.capital}</p>
          )}
          renderRevealExtra={(item) => (
            <ul className="facts">
              {item.facts.map((fact, i) => (
                <li key={i}>{fact}</li>
              ))}
            </ul>
          )}
        />
      )}

      {tab === 'flags' && (
        <QuizView
          engine={flagsEngine}
          promptText="Welches Land ist das?"
          inputPlaceholder="Land eingeben"
          emptyTitle="Für jetzt fertig 🎉"
          emptyText="Aktuell ist keine Flagge fällig. Schau später wieder vorbei, oder starte eine neue Runde."
          renderQuestion={(item) => <div className="flag-display">{flagEmoji(item.code)}</div>}
          renderRevealAnswer={(item) => (
            <p className="capital-answer">{item.country}</p>
          )}
          renderRevealExtra={(item) => (
            <p className="flag-bonus">Hauptstadt: {item.capital}</p>
          )}
        />
      )}

      <TabBar active={tab} onChange={setTab} />
    </div>
  )
}
