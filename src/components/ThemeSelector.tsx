import React from 'react'

type ThemeSelectorProps = {
  allThemes: string[]
  selectedThemes: string[]
  toggleTheme: (theme: string) => void
  specialThemes?: string[]
}

export default function ThemeSelector({
  allThemes,
  selectedThemes,
  toggleTheme,
  specialThemes = []
}: ThemeSelectorProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
      
      {/* Default Themes */}
      {allThemes.map((theme) => (
        <button
          key={theme}
          onClick={() => toggleTheme(theme)}
          style={{
            width: '100%',
            textAlign: 'left',
            padding: '0.75rem',
            borderRadius: '0.375rem',
            border: '2px solid #000000ff',
            backgroundColor: selectedThemes.includes(theme) ? '#7baf02ff' : 'white',
            color: selectedThemes.includes(theme) ? 'white' : '#1e293b',
            cursor: 'pointer'
          }}
        >
          {theme}
        </button>
      ))}

      {/* Special Themes */}
      {specialThemes.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Special Packs</h4>
          {specialThemes.map((theme) => (
            <button
              key={theme}
              onClick={() => toggleTheme(theme)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '0.75rem',
                borderRadius: '0.375rem',
                border: '2px solid #828501ff',
                backgroundColor: selectedThemes.includes(theme) ? '#c79611ff' : 'white',
                color: selectedThemes.includes(theme) ? 'white' : '#000000ff',
                cursor: 'pointer'
              }}
            >
              {theme}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
