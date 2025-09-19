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
      <p style={{ color: '#000000ff', fontWeight: 900 }}>{name}</p>
    </button>
  )
}
