'use client'
import React from 'react'

export type Player = {
  id: string
  user_id: string
  name: string
  role: 'player' | 'imposter' | null
  is_host: boolean
  revealed: boolean
}

type Props = {
  players: Player[]
  meUserId: string | null
  currentPlayerId: string | null
}

export default function PlayersList({ players, meUserId, currentPlayerId }: Props) {
  return (
    <div>
      <h2 className="font-semibold mb-2">Players</h2>
      <ul className="space-y-1">
        {players.map((p) => {
          const isMe = p.user_id === meUserId
          const isCurrent = p.id === currentPlayerId
          return (
            <li key={p.id}>
              {p.name}
              {isMe ? ' (You)' : ''} {p.is_host ? '(Host)' : ''}{' '}
              {p.revealed ? '✓' : ''} {isCurrent ? '←' : ''}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
