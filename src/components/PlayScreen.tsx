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
    <div className="card max-w-md mx-auto p-4 sm:p-6 text-center space-y-6">
      <h2 className="text-2xl sm:text-3xl font-bold">Game Started!</h2>

      <div className="player-card bg-indigo-100 p-4 rounded-lg">
        <p className="font-medium text-sm sm:text-base">Starting Player:</p>
        <p className="text-xl sm:text-2xl font-bold text-indigo-700">
          {players[startingPlayerIndex].name}
        </p>
      </div>

      <button
        onClick={() => setStep('complete')}
        className="btn btn-primary w-full sm:w-auto py-3 px-6 sm:px-8 rounded-lg hover:scale-105 transition-transform"
      >
        Finish Game
      </button>
    </div>
  )
}
