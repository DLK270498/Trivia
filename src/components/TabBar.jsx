const TABS = [
  { key: 'capitals', label: 'Hauptstädte', icon: '🏛️' },
  { key: 'flags', label: 'Flaggen', icon: '🏳️' },
]

export default function TabBar({ active, onChange }) {
  return (
    <nav className="tab-bar">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          className={`tab-button ${active === tab.key ? 'is-active' : ''}`}
          onClick={() => onChange(tab.key)}
        >
          <span className="tab-icon">{tab.icon}</span>
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
