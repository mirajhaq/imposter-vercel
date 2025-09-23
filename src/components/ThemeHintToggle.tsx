// src/components/ThemeHintToggle.tsx
import React from 'react'

type ThemeHintToggleProps = {
  themeHintEnabled: boolean
  setThemeHintEnabled: (v: boolean) => void
}

export default function ThemeHintToggle({ themeHintEnabled, setThemeHintEnabled }: ThemeHintToggleProps) {
  return (
    <button
      onClick={() => setThemeHintEnabled(!themeHintEnabled)}
      className="card"
      style={{
        all: 'unset',
        cursor: 'pointer',
        display: 'block',
        maxWidth: 'none',
        marginBottom: '1rem',
        padding: '0rem',
      }}
    >
      <h2 style={{ fontSize: '1rem', fontWeight: '600', color: '#000000ff', marginBottom: '1rem' }}>Theme Hint</h2>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.5rem 1rem',
          maxWidth: '250px',
          backgroundColor: '#f6f1f9ff',
          borderRadius: '0.375rem',
          margin: '0 auto',
        }}
      >
        <span style={{ fontSize: '1rem', color: '#475569' }}>{themeHintEnabled ? 'Enabled' : 'Disabled'}</span>
        <span
          style={{
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            backgroundColor: themeHintEnabled ? '#10b981' : '#ef4444',
            color: 'white',
            fontWeight: 600,
          }}
        >
          {themeHintEnabled ? 'On' : 'Off'}
        </span>
      </div>
    </button>
  )
}
