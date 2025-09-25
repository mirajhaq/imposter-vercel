import React from 'react'
import ThemeSelector from './ThemeSelector'

type ThemeEditorModalProps = {
  allThemes: string[]
  selectedThemes: string[]
  specialThemes?: string[]
  toggleTheme: (theme: string) => void
  onClose: () => void
}

export default function ThemeEditorModal({ allThemes, selectedThemes, specialThemes = [], toggleTheme, onClose }: ThemeEditorModalProps) {
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
      <div
        style={{
          backgroundColor: '#dfdfdfff',
          borderRadius: '12px',
          maxWidth: '28rem',
          width: '100%',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1e293b' }}>Select Themes</h3>
          <button onClick={onClose} style={{ color: '#9ca3af', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          <ThemeSelector
            allThemes={allThemes}
            selectedThemes={selectedThemes}
            specialThemes={specialThemes} // show special packs here
            toggleTheme={toggleTheme}
          />
        </div>

        <div style={{ padding: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
          <button
            onClick={onClose}
            style={{ width: '100%', padding: '0.75rem', backgroundColor: '#1a0101ff', color: 'white', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', fontWeight: 500 }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
