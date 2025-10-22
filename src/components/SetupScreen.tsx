'use client'
import React, { useState, useCallback } from 'react'
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

/* ---------- Name storage helpers (same key used elsewhere) ---------- */
const NAME_KEY = 'party_name'
const getStoredName = (): string | null => {
  if (typeof window === 'undefined') return null
  try {
    const v = localStorage.getItem(NAME_KEY)
    if (v) return v
    const m = document.cookie.match(new RegExp('(^| )' + NAME_KEY + '=([^;]+)'))
    return m ? decodeURIComponent(m[2]) : null
  } catch {
    return null
  }
}
const setStoredName = (name: string) => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(NAME_KEY, name)
    const expires = new Date()
    expires.setFullYear(expires.getFullYear() + 1)
    document.cookie = `${NAME_KEY}=${encodeURIComponent(name)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
  } catch {}
}

/* ---------- Tiny inline modal for name capture ---------- */
function NameModal({
  title,
  initial,
  onSubmit,
  onClose,
}: {
  title: string
  initial?: string
  onSubmit: (name: string) => void
  onClose?: () => void
}) {
  const [name, setName] = useState(initial ?? '')
  const canSave = name.trim().length > 0 && name.trim().length <= 30

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center z-[1000]">
      <div className="bg-white rounded-2xl shadow-xl p-5 w-full max-w-sm">
        <h3 className="text-lg font-semibold mb-3 text-center">{title}</h3>
        <input
          className="w-full border rounded-lg px-3 py-2 outline-none"
          placeholder="e.g. Alex"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={30}
          autoFocus
        />
        <div className="flex gap-2 justify-end mt-4">
          {onClose && (
            <button className="px-3 py-2 rounded-lg border" onClick={onClose}>
              Cancel
            </button>
          )}
          <button
            className="px-3 py-2 rounded-lg bg-black text-white disabled:opacity-50"
            disabled={!canSave}
            onClick={() => onSubmit(name.trim())}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
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

  // name modal state + pending action
  const [nameModalOpen, setNameModalOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<'host' | 'join' | null>(null)
  const [pendingJoinCode, setPendingJoinCode] = useState<string>('')

  const requireSession = useCallback(async () => {
    const { data: session } = await supabase.auth.getSession()
    if (!session?.session) {
      await supabase.auth.signInAnonymously()
    }
  }, [])

  /* -------------------- Host flow -------------------- */
  const hostOnlineGame = async () => {
    try {
      setOnlineBusy(true)
      await requireSession()

      const saved = getStoredName()
      if (!saved) {
        setPendingAction('host')
        setNameModalOpen(true)
        return
      }
      await hostOnlineGameWithName(saved)
    } catch (err: any) {
      alert(err.message || 'Failed to host room')
    } finally {
      setOnlineBusy(false)
    }
  }

  const hostOnlineGameWithName = async (hostName: string) => {
    const { data, error } = await supabase.rpc('create_room', { host_name: hostName })
    if (error) throw error

    const roomCode = (Array.isArray(data) ? data[0]?.code : data?.code) ?? null
    if (!roomCode) throw new Error('No room code returned')

    // Save for next time
    setStoredName(hostName)

    alert(`Room created! Code: ${roomCode}`)
    window.location.assign(`/r/${roomCode}`)
  }

  /* -------------------- Join flow -------------------- */
  const joinOnlineGame = async () => {
    try {
      setOnlineBusy(true)

      const code = (prompt('Enter room code') || '').toUpperCase()
      if (!code) return

      await requireSession()

      const saved = getStoredName()
      if (!saved) {
        setPendingJoinCode(code)
        setPendingAction('join')
        setNameModalOpen(true)
        return
      }
      await joinOnlineGameWithName(code, saved)
    } catch (err: any) {
      alert(err.message || 'Failed to join room')
    } finally {
      setOnlineBusy(false)
    }
  }

  const joinOnlineGameWithName = async (code: string, playerName: string) => {
    const { error } = await supabase.rpc('join_room', {
      room_code: code,
      player_name: playerName,
    })
    if (error) throw error

    // Save for next time
    setStoredName(playerName)

    alert(`Joined room ${code}`)
    window.location.assign(`/r/${code}`)
  }

  /* ------------- Name modal submit handler ------------- */
  const handleNameSubmit = async (name: string) => {
    try {
      setOnlineBusy(true)
      await requireSession()
      if (pendingAction === 'host') {
        await hostOnlineGameWithName(name)
      } else if (pendingAction === 'join' && pendingJoinCode) {
        await joinOnlineGameWithName(pendingJoinCode, name)
      }
    } catch (err: any) {
      alert(err.message || 'Something went wrong')
    } finally {
      setNameModalOpen(false)
      setPendingAction(null)
      setPendingJoinCode('')
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

        {/* Online */}
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
          <p className="text-center text-xs text-gray-500 mt-3"></p>
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

      {nameModalOpen && (
        <NameModal
          title={pendingAction === 'host' ? 'Enter a name to host' : 'Enter a name to join'}
          initial={getStoredName() ?? ''}
          onSubmit={handleNameSubmit}
          onClose={() => {
            setNameModalOpen(false)
            setPendingAction(null)
            setPendingJoinCode('')
          }}
        />
      )}
    </div>
  )
}
