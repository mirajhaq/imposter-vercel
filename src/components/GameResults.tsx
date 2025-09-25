import React from 'react'
import { Player } from '../lib/gameTypes'
import { WordPair } from '../lib/words'

type GameResultsProps = {
  wordPair: WordPair
  players: Player[]
  imposterGetsHint: boolean
  themeHintEnabled: boolean
  resetToSetup: () => void
}

export default function GameResults({
  wordPair,
  players,
  imposterGetsHint,
  themeHintEnabled,
  resetToSetup
}: GameResultsProps) {
  const imposter = players.find((p) => p.role === 'imposter')

  const hintLines: string[] = []
  if (imposterGetsHint) hintLines.push(wordPair.hint)
  if (themeHintEnabled) hintLines.push(`Theme: ${wordPair.theme}`)
  if (hintLines.length === 0) hintLines.push('No hint revealed')

  return (
    <div className="screen-center">
      <div className="game-results-card text-center">
        <h2 className="game-results-title mb-4">Game Results</h2>

        <div className="results-panel mb-4">
          <p className="results-label">Secret Word:</p>
          <p className="results-value">{wordPair.secret}</p>
        </div>

        <div className="results-panel mb-4">
          <p className="results-label">Hint:</p>
          {hintLines.map((line, index) => (
            <p key={index} className="results-value">{line}</p>
          ))}
        </div>

        <div className="results-panel mb-6">
          <p className="results-label">The Imposter Was:</p>
          <p className="results-value imposter-name">{imposter?.name}</p>
        </div>

        <button
          onClick={resetToSetup}
          className="btn btn-primary game-results-button"
        >
          Play Again
        </button>
      </div>
    </div>
  )
}
