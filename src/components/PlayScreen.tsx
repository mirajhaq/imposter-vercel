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
    <div className="screen-center">
      <div className="play-screen-card text-center">
        <h2 className="play-screen-title">This player starts:</h2>

        <div className="starting-player-box my-6">
          <p className="starting-player-label"></p>
          <p className="starting-player-name">
            {players[startingPlayerIndex].name}
          </p>
        </div>

        <button
          onClick={() => setStep('complete')}
          className="btn btn-primary play-screen-button"
        >
          Finish Game
        </button>
      </div>
    </div>
  )
}
