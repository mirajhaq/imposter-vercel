import React from 'react'

type ThemeTileProps = {
  selectedThemes: string[]
  allThemes: string[]
  onClick: () => void
}

export default function ThemeTile({ selectedThemes, allThemes, onClick }: ThemeTileProps) {
  return (
    <button
      onClick={onClick}
      className="card"
      style={{
        all: 'unset',
        cursor: 'pointer',
        display: 'block',
        maxWidth: 'none',
        marginBottom: '1rem',
        padding: '1rem',
      }}
    >
      <h2 style={{ fontSize: '1rem', fontWeight: '600', color: '#000000ff', marginBottom: '1.5rem' }}>Themes</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {selectedThemes.length === 0
          ? allThemes.map((theme) => (
              <span
                key={theme}
                style={{ padding: '0.5rem 1rem', backgroundColor: '#e2e8f0', borderRadius: '4px', color: '#64748b' }}
              >
                {theme}
              </span>
            ))
          : selectedThemes.map((theme) => (
              <span
                key={theme}
                style={{ padding: '0.5rem 1rem', backgroundColor: '#3b82f6', color: 'white', borderRadius: '9999px' }}
              >
                {theme}
              </span>
            ))}
      </div>
    </button>
  )
}
