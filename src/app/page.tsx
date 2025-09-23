// src/app/page.tsx
'use client'
import React from 'react'
import { useGameLogic } from '../hooks/useGameLogic'
import SetupScreen from '../components/SetupScreen'
import PlayerReveal from '../components/PlayerReveal'
import PlayScreen from '../components/PlayScreen'
import GameResults from '../components/GameResults'

export default function Home() {
  const game = useGameLogic()

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-4 sm:p-6 md:p-8">
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
            imposterGetsHint={game.imposterGetsHint}
            setImposterGetsHint={game.setImposterGetsHint}
            themeHintEnabled={game.themeHintEnabled}
            setThemeHintEnabled={game.setThemeHintEnabled}
          />
        )}

        {game.step === 'reveal' && game.players.length > 0 && (
          <PlayerReveal
            key={game.players[game.currentRevealIndex].id}
            name={game.players[game.currentRevealIndex].name}
            isImposter={game.players[game.currentRevealIndex].role === 'imposter'}
            secret={game.wordPair.secret}
            hint={game.imposterGetsHint ? game.wordPair.hint : ''}
            theme={game.wordPair.theme}
            themeHintEnabled={game.themeHintEnabled}
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
            imposterGetsHint={game.imposterGetsHint}
            themeHintEnabled={game.themeHintEnabled}
            resetToSetup={game.resetToSetup}
          />
        )}
      </div>
    </div>
  )
}
