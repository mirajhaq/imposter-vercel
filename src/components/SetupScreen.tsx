// src/components/SetupScreen.tsx
import React, { useState } from 'react'
import PlayerTile from './PlayerTile'
import PlayerEditorModal from './PlayerEditorModal'
import ThemeTile from './ThemeTile'
import ThemeEditorModal from './ThemeEditorModal'
import ImposterHintToggle from './ImposterHintToggle'

type SetupScreenProps = {
  numPlayers: number
  setNumPlayers: (n: number) => void
  localNames: string[]
  setLocalNames: (names: string[]) => void
  allThemes: string[]
  selectedThemes: string[]
  toggleTheme: (theme: string) => void
  startGame: () => void
  imposterGetsHint: boolean
  setImposterGetsHint: (v: boolean) => void
}

export default function SetupScreen({
  numPlayers,
  setNumPlayers,
  localNames,
  setLocalNames,
  allThemes,
  selectedThemes,
  toggleTheme,
  startGame,
  imposterGetsHint,
  setImposterGetsHint,
}: SetupScreenProps) {
  const [showPlayerEditor, setShowPlayerEditor] = useState(false)
  const [showThemeEditor, setShowThemeEditor] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-100 to-gray-200 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Title */}
        <div className="text-center space-y-1">
          <h1 className="text-3xl sm:text-4xl font-bold">Imposter</h1>
          <p className="text-gray-500">Made by Mir</p>
        </div>

        {/* Players Section */}
        <div 
  className="card p-4 sm:p-6 cursor-pointer hover:shadow-md transition"
  onClick={() => setShowPlayerEditor(true)}
>
  {/* Center title */}
  <div className="text-center mb-4">
    <h2 className="text-lg font-semibold">Players ({numPlayers})</h2>
  </div>

  {/* Center player tiles */}
  <div style={{
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center', // centers the tiles
    gap: '0.5rem',           // spacing between tiles
  }}>
    {Array.from({ length: numPlayers }).map((_, i) => (
      <PlayerTile
        key={i}
        name={localNames[i] || `Player ${i + 1}`}
        onClick={() => setShowPlayerEditor(true)}
      />
    ))}
  </div>
</div>
        {/* Theme Section */}
        <ThemeTile
          selectedThemes={selectedThemes}
          allThemes={allThemes}
          onClick={() => setShowThemeEditor(true)}
        />

        {/* Imposter Hint Toggle */}
        <ImposterHintToggle
          imposterGetsHint={imposterGetsHint}
          setImposterGetsHint={setImposterGetsHint}
        />

        {/* Start Game */}
        <div className="text-center">
          <button
            onClick={startGame}
            className="start-game-button"
          >
            Start Game
          </button>
        </div>
      </div>

      {/* Modals */}
      {showPlayerEditor && (
        <PlayerEditorModal
          numPlayers={numPlayers}
          localNames={localNames}
          setLocalNames={setLocalNames}
          setNumPlayers={setNumPlayers}
          onClose={() => setShowPlayerEditor(false)}
        />
      )}

      {showThemeEditor && (
        <ThemeEditorModal
          allThemes={allThemes}
          selectedThemes={selectedThemes}
          toggleTheme={toggleTheme}
          onClose={() => setShowThemeEditor(false)}
        />
      )}
    </div>
  )
}
