// src/components/PlayScreen.tsx
import React from 'react'
import { Player } from '../lib/gameTypes'

type PlayScreenProps = {
  players: Player[]
  startingPlayerIndex: number
  setStep: (step: 'complete') => void
}

export default function PlayScreen({
  players,
  startingPlayerIndex,
  setStep
}: PlayScreenProps) {
  return (
    <div className="card text-center">
      <h2 className="step-title">Game Started!</h2>

      <div className="player-card mb-6 bg-indigo-100">
        <p className="font-medium">Starting Player:</p>
        <p className="text-2xl font-bold text-indigo-700">
          {players[startingPlayerIndex].name}
        </p>
      </div>

      <button
        onClick={() => setStep('complete')}
        className="btn btn-primary"
      >
        Finish Game
      </button>
    </div>
  )
}
