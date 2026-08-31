// Wandelt einen ISO-3166-1-Alpha-2-Code in das entsprechende Flaggen-Emoji um
// (zwei "regional indicator symbols", z.B. DE -> 🇩🇪).
export function flagEmoji(code) {
  if (!code || code.length !== 2) return '🏳️'
  return code
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
}
