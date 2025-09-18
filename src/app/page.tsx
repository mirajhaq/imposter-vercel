// src/app/page.tsx
'use client'
import React, { useState } from 'react'
import { useGameLogic } from '../hooks/useGameLogic'
import SetupScreen from '../components/SetupScreen'
import PlayerReveal from '../components/PlayerReveal'
import PlayScreen from '../components/PlayScreen'
import GameResults from '../components/GameResults'

export default function Home() {
  const game = useGameLogic()
  const [imposterGetsHint, setImposterGetsHint] = useState(true)

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      {game.step === 'setup' && (
        <SetupScreen
          numPlayers={game.numPlayers}
          setNumPlayers={game.setNumPlayers}
          localNames={game.localNames}
          setLocalNames={game.setLocalNames}
          allThemes={game.allThemes}
          selectedThemes={game.selectedThemes}
          toggleTheme={game.toggleTheme}
          startGame={game.startGame}
          imposterGetsHint={imposterGetsHint}
          setImposterGetsHint={setImposterGetsHint}
        />
      )}

      {game.step === 'reveal' && game.players.length > 0 && (
        <PlayerReveal
          key={game.players[game.currentRevealIndex].id}
          name={game.players[game.currentRevealIndex].name}
          isImposter={game.players[game.currentRevealIndex].role === 'imposter'}
          secret={game.wordPair.secret}
          hint={imposterGetsHint ? game.wordPair.hint : ''}
          onDone={game.doneReveal}
          isLastPlayer={game.currentRevealIndex === game.players.length - 1}
        />
      )}

      {game.step === 'play' && (
        <PlayScreen
          players={game.players}
          startingPlayerIndex={game.startingPlayerIndex}
          setStep={game.setStep}
        />
      )}

      {game.step === 'complete' && (
        <GameResults
          wordPair={game.wordPair}
          players={game.players}
          resetToSetup={game.resetToSetup}
        />
      )}
    </div>
  )
}
