import React from 'react'

type PlayerTileProps = {
  name: string
  onClick: () => void
}

export default function PlayerTile({ name, onClick }: PlayerTileProps) {
  return (
    <button
      onClick={onClick}
      style={{
        all: 'unset',
        cursor: 'pointer',
        display: 'inline-block',
        margin: '0.25rem', // add spacing around each tile
      }}
    >
      <div
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#a9c7f3ff',
          borderRadius: '8px',
          border: '2px solid rgba(167, 167, 167, 1)',
          minWidth: '80px',
          textAlign: 'center',
        }}
      >
        <span style={{ color: '#000', fontWeight: 550 }}>{name}</span>
      </div>
    </button>
  )
}
