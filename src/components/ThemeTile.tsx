import React from 'react'

type ThemeTileProps = {
  selectedThemes: string[]
  allThemes: string[]
  specialThemes?: string[]  // optional
  onClick: () => void
}

export default function ThemeTile({
  selectedThemes,
  allThemes,
  specialThemes = [],  // default value here
  onClick
}: ThemeTileProps) {
  return (
    <div onClick={onClick}>
      {/* Default Themes */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
        {allThemes.map((theme) => (
          <span
            key={theme}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: selectedThemes.includes(theme) ? '#c79611ff' : '#c2c2c2ff',
              color: selectedThemes.includes(theme) ? 'white' : '#64748b',
              borderRadius: '9999px'
            }}
          >
            {theme}
          </span>
        ))}
      </div>

      {/* Special Packs */}
      {specialThemes.length > 0 && (
        <div style={{ marginTop: '0.5rem' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Special Packs</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {specialThemes.map((theme) => (
              <span
                key={theme}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: selectedThemes.includes(theme) ? '#3b82f6' : '#c2c2c2ff',
                  color: selectedThemes.includes(theme) ? 'white' : '#64748b',
                  borderRadius: '9999px',
                  cursor: 'pointer'
                }}
              >
                {theme}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
