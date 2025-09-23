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
        display: 'inline-block',
        margin: '0.25rem', // add spacing around each tile
      }}
    >
      <h2 style={{ fontSize: '1rem', fontWeight: '600', color: '#000000ff', marginBottom: '1.5rem' }}></h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {selectedThemes.length === 0
          ? allThemes.map((theme) => (
              <span
                key={theme}
                style={{ padding: '0.5rem 1rem', backgroundColor: '#c2c2c2ff', borderRadius: '4px', color: '#64748b' }}
              >
                {theme}
              </span>
            ))
          : selectedThemes.map((theme) => (
              <span
                key={theme}
                style={{ padding: '0.5rem 1rem', backgroundColor: '#c79611ff', color: 'white', borderRadius: '9999px' }}
              >
                {theme}
              </span>
            ))}
      </div>
    </button>
  )
}
