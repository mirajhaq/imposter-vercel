import React from 'react'

type ImposterHintToggleProps = {
  imposterGetsHint: boolean
  setImposterGetsHint: (v: boolean) => void
}

export default function ImposterHintToggle({ imposterGetsHint, setImposterGetsHint }: ImposterHintToggleProps) {
  return (
    <button
      onClick={() => setImposterGetsHint(!imposterGetsHint)}
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
      <h2 style={{ fontSize: '1rem', fontWeight: '600', color: '#000000ff', marginBottom: '1rem' }}>Imposter Hint</h2>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.5rem 1rem',
          maxWidth: '250px',
          backgroundColor: '#f1f5f9',
          borderRadius: '0.375rem',
          margin: '0 auto',
        }}
      >
        <span style={{ fontSize: '1rem', color: '#475569' }}>{imposterGetsHint ? 'Enabled' : 'Disabled'}</span>
        <span
          style={{
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            backgroundColor: imposterGetsHint ? '#10b981' : '#ef4444',
            color: 'white',
            fontWeight: 600,
          }}
        >
          {imposterGetsHint ? 'On' : 'Off'}
        </span>
      </div>
    </button>
  )
}
