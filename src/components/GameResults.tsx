// src/components/GameResults.tsx
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

  // Determine what the imposter saw
  const hintLines: string[] = []
  if (imposterGetsHint) hintLines.push(wordPair.hint)
  if (themeHintEnabled) hintLines.push(`Theme: ${wordPair.theme}`)
  if (hintLines.length === 0) hintLines.push('No hint revealed')

  return (
    <div className="card text-center">
      <h2 className="step-title">Game Results</h2>

      <div className="info-card mb-6">
        <p className="text-lg mb-2">Secret Word was:</p>
        <p className="text-2xl font-bold">{wordPair.secret}</p>

        <p className="text-lg mt-2">Hint was:</p>
        {hintLines.map((line, index) => (
          <p key={index} className="text-xl">{line}</p>
        ))}
      </div>

      <div className="alert-card mb-6">
        <p className="text-lg mb-2">The imposter was:</p>
        <p className="text-2xl font-bold text-red-600">
          {imposter?.name}
        </p>
      </div>

      <button
        onClick={resetToSetup}
        className="btn btn-primary"
      >
        Play Again
      </button>
    </div>
  )
}
