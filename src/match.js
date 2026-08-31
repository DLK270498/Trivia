function normalize(str) {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // Akzente/Diakritika entfernen (nach NFD-Zerlegung)
    .toLowerCase()
    .replace(/['’.]/g, '')
    .replace(/[-–—,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function levenshtein(a, b) {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m

  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      )
    }
  }
  return dp[m][n]
}

// Je länger das Wort, desto mehr Tippfehler werden toleriert (max. 2).
function toleranceFor(length) {
  if (length <= 3) return 0
  if (length <= 5) return 1
  return 2
}

export function isFuzzyMatch(guess, capital, aliases = []) {
  const normalizedGuess = normalize(guess)
  if (!normalizedGuess) return false

  return [capital, ...aliases].some((candidate) => {
    const normalizedCandidate = normalize(candidate)
    const distance = levenshtein(normalizedGuess, normalizedCandidate)
    return distance <= toleranceFor(normalizedCandidate.length)
  })
}
