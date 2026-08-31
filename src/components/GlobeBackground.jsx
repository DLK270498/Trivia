// Dezenter Weltkugel-Wireframe plus weiche Farb-Blobs als Hintergrund,
// angelehnt an das ruhige, tiefe "Space"-Look von Apple-Marketingseiten.
export default function GlobeBackground() {
  return (
    <div className="bg-decor" aria-hidden="true">
      <div className="bg-blob bg-blob-1" />
      <div className="bg-blob bg-blob-2" />
      <div className="bg-blob bg-blob-3" />
      <svg className="bg-globe" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
        <g fill="none" stroke="white" strokeWidth="1.1">
          <circle cx="400" cy="400" r="320" />
          <ellipse cx="400" cy="400" rx="120" ry="320" />
          <ellipse cx="400" cy="400" rx="240" ry="320" />
          <ellipse cx="400" cy="400" rx="320" ry="320" />
          <line x1="80" y1="400" x2="720" y2="400" />
          <ellipse cx="400" cy="400" rx="320" ry="160" />
          <ellipse cx="400" cy="400" rx="320" ry="260" />
          <ellipse cx="400" cy="400" rx="280" ry="80" transform="rotate(0 400 400)" />
        </g>
        <g fill="white">
          <circle cx="400" cy="220" r="5" />
          <circle cx="540" cy="330" r="4" />
          <circle cx="270" cy="470" r="4.5" />
          <circle cx="470" cy="560" r="3.5" />
          <circle cx="300" cy="280" r="3.5" />
        </g>
      </svg>
    </div>
  )
}
