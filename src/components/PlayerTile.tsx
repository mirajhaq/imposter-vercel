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
        display: 'block',
        textAlign: 'center',
      }}
    >
      <p style={{ color: '#3b82f6', fontWeight: 500 }}>{name}</p>
    </button>
  )
}
