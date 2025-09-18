// src/components/ThemeSelector.tsx
import React from 'react'

type ThemeSelectorProps = {
  allThemes: string[]
  selectedThemes: string[]
  toggleTheme: (theme: string) => void
}

export default function ThemeSelector({
  allThemes,
  selectedThemes,
  toggleTheme
}: ThemeSelectorProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
      {allThemes.map((theme) => (
        <button
          key={theme}
          onClick={() => toggleTheme(theme)}
          style={{
            width: '100%',
            textAlign: 'left',
            padding: '0.75rem',
            borderRadius: '0.375rem',
            border: '1px solid #d1d5db',
            backgroundColor: selectedThemes.includes(theme) ? '#3b82f6' : 'white',
            color: selectedThemes.includes(theme) ? 'white' : '#1e293b',
            cursor: 'pointer'
          }}
        >
          {theme}
        </button>
      ))}
    </div>
  )
}
