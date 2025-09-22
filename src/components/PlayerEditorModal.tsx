import React, { useState } from 'react'

type PlayerEditorModalProps = {
  numPlayers: number
  localNames: string[]
  setLocalNames: (names: string[]) => void
  setNumPlayers: (n: number) => void
  onClose: () => void
}

export default function PlayerEditorModal({ numPlayers, localNames, setLocalNames, setNumPlayers, onClose }: PlayerEditorModalProps) {
  const [newPlayerName, setNewPlayerName] = useState('')

  const handlePlayerNameChange = (index: number, name: string) => {
    const copy = [...localNames]
    copy[index] = name
    setLocalNames(copy)
  }

  const addPlayerFromEditor = () => {
    if (numPlayers < 8 && newPlayerName.trim()) {
      setNumPlayers(numPlayers + 1)
      const copy = [...localNames]
      copy[numPlayers] = newPlayerName.trim()
      setLocalNames(copy)
      setNewPlayerName('')
    }
  }

  const removePlayer = (index: number) => {
    if (numPlayers > 3) {
      setNumPlayers(numPlayers - 1)
      const copy = [...localNames]
      copy.splice(index, 1)
      setLocalNames(copy)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        zIndex: 50,
      }}
    >
      <div style={{ backgroundColor: '#f1ededff', borderRadius: '12px', maxWidth: '28rem', width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e293b' }}>Edit Player Names</h3>
            <button onClick={onClose} style={{ color: '#000000ff', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {Array.from({ length: numPlayers }).map((_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '2rem', height: '2rem', backgroundColor: '#757475ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: '#000000ff', fontWeight: '700', fontSize: '0.875rem' }}>{i + 1}</span>
                </div>
                <input
                  value={localNames[i] || ''}
                  onChange={(e) => handlePlayerNameChange(i, e.target.value)}
                  placeholder={`Player ${i + 1}`}
                  style={{ flex: 1, padding: '0.5rem', border: '2px solid #000000ff', borderRadius: '0.375rem' }}
                />
                {numPlayers > 3 && (
                  <button
                    onClick={() => removePlayer(i)}
                    style={{ width: '2rem', height: '2rem', color: '#ef4444', backgroundColor: 'transparent', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '1.25rem' }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}

            {numPlayers < 8 && (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div style={{ width: '2rem', height: '2rem', backgroundColor: '#f3f4f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: '#6b7280', fontWeight: '500', fontSize: '1rem' }}>+</span>
                </div>
                <input
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  placeholder="Enter new player name"
                  style={{ flex: 1, padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem' }}
                  onKeyDown={(e) => { if (e.key === 'Enter') addPlayerFromEditor() }}
                />
                <button
                  onClick={addPlayerFromEditor}
                  disabled={!newPlayerName.trim()}
                  style={{ padding: '0.5rem 1rem', opacity: newPlayerName.trim() ? 1 : 1, cursor: newPlayerName.trim() ? 'pointer' : 'not-allowed', backgroundColor: '#baeb09ff', color: 'black', borderRadius: '0.375rem', border: 'none' }}
                >
                  Add
                </button>
              </div>
            )}
          </div>

          <div style={{ marginTop: '2rem' }}>
            <button
              onClick={onClose}
              style={{ width: '100%', padding: '0.75rem', backgroundColor: '#1f1313ff', color: 'white', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', fontWeight: '500' }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
