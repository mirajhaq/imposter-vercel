import React, { useState } from 'react'
import PlayerTile from './PlayerTile'
import PlayerEditorModal from './PlayerEditorModal'
import ThemeTile from './ThemeTile'
import ThemeEditorModal from './ThemeEditorModal'
import ImposterHintToggle from './ImposterHintToggle'
import ThemeSelector from './ThemeSelector'

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
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #fcf9f8ff 0%, #e2e8f0 100%)', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Imposter</h1>
          <p style={{ fontSize: '1.125rem', color: '#64748b' }}>Made by Mir</p>
        </div>

        {/* Players Section */}
        <div className="card" style={{ maxWidth: 'none', marginBottom: '1.5rem', padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: '600', color: '#000000ff' }}>Players ({numPlayers})</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.25rem', marginBottom: '1rem' }}>
            {Array.from({ length: numPlayers }).map((_, i) => (
              <PlayerTile key={i} name={localNames[i] || `Player ${i + 1}`} onClick={() => setShowPlayerEditor(true)} />
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
        <ImposterHintToggle imposterGetsHint={imposterGetsHint} setImposterGetsHint={setImposterGetsHint} />

        {/* Start Game */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={startGame}
            style={{
              fontSize: '1.125rem',
              fontWeight: '700',
              padding: '1rem 3rem',
              backgroundColor: '#df7436ff',
              color: 'white',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
            }}
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
