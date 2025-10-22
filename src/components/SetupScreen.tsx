'use client'
import React, { useState } from 'react'
import PlayerTile from './PlayerTile'
import PlayerEditorModal from './PlayerEditorModal'
import ThemeTile from './ThemeTile'
import ThemeEditorModal from './ThemeEditorModal'
import ImposterHintToggle from './ImposterHintToggle'
import ThemeHintToggle from './ThemeHintToggle'
import { supabase } from '../lib/supabaseClient'

type SetupScreenProps = {
  numPlayers: number
  setNumPlayers: (n: number) => void
  localNames: string[]
  setLocalNames: (names: string[]) => void
  allThemes: string[]
  specialThemes: string[]
  selectedThemes: string[]
  toggleTheme: (theme: string) => void
  startGame: () => void
  imposterGetsHint: boolean
  setImposterGetsHint: (v: boolean) => void
  themeHintEnabled: boolean
  setThemeHintEnabled: (v: boolean) => void
}

export default function SetupScreen({
  numPlayers,
  setNumPlayers,
  localNames,
  setLocalNames,
  allThemes,
  specialThemes,
  selectedThemes,
  toggleTheme,
  startGame,
  imposterGetsHint,
  setImposterGetsHint,
  setThemeHintEnabled,
  themeHintEnabled,
}: SetupScreenProps) {
  const [showPlayerEditor, setShowPlayerEditor] = useState(false)
  const [showThemeEditor, setShowThemeEditor] = useState(false)
  const [onlineBusy, setOnlineBusy] = useState(false)

  // --- Online: Host game
  const hostOnlineGame = async () => {
    try {
      setOnlineBusy(true)

      // make sure user has a session
      const { data: session } = await supabase.auth.getSession()
      if (!session?.session) {
        await supabase.auth.signInAnonymously()
      }

      const hostName = prompt('Enter your name') || 'Host'
      const { data, error } = await supabase.rpc('create_room', { host_name: hostName })
      if (error) throw error

      const roomCode = (Array.isArray(data) ? data[0]?.code : data?.code) ?? null
      if (!roomCode) throw new Error('No room code returned')

      alert(`Room created! Code: ${roomCode}`)
      window.location.assign(`/r/${roomCode}`)
    } catch (err: any) {
      alert(err.message || 'Failed to host room')
    } finally {
      setOnlineBusy(false)
    }
  }

  // --- Online: Join game
  const joinOnlineGame = async () => {
    try {
      setOnlineBusy(true)

      const code = (prompt('Enter room code') || '').toUpperCase()
      if (!code) return
      const playerName = prompt('Enter your name') || 'Player'

      const { data: session } = await supabase.auth.getSession()
      if (!session?.session) {
        await supabase.auth.signInAnonymously()
      }

      const { error } = await supabase.rpc('join_room', {
        room_code: code,
        player_name: playerName,
      })
      if (error) throw error

      alert(`Joined room ${code}`)
      window.location.assign(`/r/${code}`)
    } catch (err: any) {
      alert(err.message || 'Failed to join room')
    } finally {
      setOnlineBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-100 to-gray-200 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Title */}
        <div className="text-center space-y-1">
          <h1 className="imposter-title text-3xl sm:text-4xl">Minposter</h1>
          <p className="imposter-subtitle"></p>
        </div>

        {/* Online (beta) - moved up */}
        <div className="card p-4 sm:p-6">
          <h2 className="text-center font-semibold mb-4">Online</h2>
          <div className="grid grid-cols-2 gap-6">
            <button
              onClick={hostOnlineGame}
              disabled={onlineBusy}
              className="online-game-button"
            >
              {onlineBusy ? 'Working...' : 'Host'}
            </button>
            <button
              onClick={joinOnlineGame}
              disabled={onlineBusy}
              className="online-game-button"
            >
              {onlineBusy ? 'Working...' : 'Join'}
            </button>
          </div>
          <p className="text-center text-xs text-gray-500 mt-3">
          </p>
        </div>

        {/* Players Section */}
        <div
          className="card p-4 sm:p-6 cursor-pointer hover:shadow-md transition"
          onClick={() => setShowPlayerEditor(true)}
        >
          <div className="text-center mb-4">
            <h2 className="text-lg font-semibold">Players ({numPlayers})</h2>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.5rem' }}>
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
        <div
          className="card p-4 sm:p-6 cursor-pointer hover:shadow-md transition"
          onClick={() => setShowThemeEditor(true)}
        >
          <div className="text-center mb-4">
            <h2 className="text-lg font-semibold">Themes</h2>
          </div>

          {/* Only show default themes here */}
          <ThemeTile
            selectedThemes={selectedThemes}
            allThemes={allThemes}
            specialThemes={specialThemes}
            onClick={() => setShowThemeEditor(true)}
          />
        </div>

        {/* Hint Toggles */}
        <div className="card p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <ImposterHintToggle
              imposterGetsHint={imposterGetsHint}
              setImposterGetsHint={setImposterGetsHint}
            />
            <ThemeHintToggle
              themeHintEnabled={themeHintEnabled}
              setThemeHintEnabled={setThemeHintEnabled}
            />
          </div>
        </div>

        {/* Start Game (local mode) */}
        <div className="text-center">
          <button
            onClick={startGame}
            className="start-game-button"
          >
            Start Local Game
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
          specialThemes={specialThemes}
          toggleTheme={toggleTheme}
          onClose={() => setShowThemeEditor(false)}
        />
      )}
    </div>
  )
}