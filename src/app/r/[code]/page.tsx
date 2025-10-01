'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Room = {
  id: string
  code: string
  state: string
}

type Player = {
  id: string
  user_id: string
  name: string
  role: string | null
  is_host: boolean
}

export default function RoomPage() {
  const params = useParams()
  const code = (params?.code as string).toUpperCase()

  const [room, setRoom] = useState<Room | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  // Get current user ID
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data?.user?.id ?? null)
    })
  }, [])

  // Fetch room + players, set up subscriptions
  useEffect(() => {
    let roomChannel: any
    let playersChannel: any

    async function init() {
      const { data: roomRow, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', code)
        .single()

      if (roomError) {
        console.error(roomError)
        setLoading(false)
        return
      }
      setRoom(roomRow as Room)

      // Subscribe to room changes
      roomChannel = supabase
        .channel(`room-${roomRow.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomRow.id}` },
          (payload) => setRoom(payload.new as Room)
        )
        .subscribe()

      // Subscribe to players changes (all, then filter by room_id)
      playersChannel = supabase
        .channel(`players-${roomRow.id}`)
        .on(
          'postgres_changes' as any,
          { event: '*', schema: 'public', table: 'players' },
          async (payload: { new: Player & { room_id: string } }) => {
            if (payload.new?.room_id === roomRow.id) {
              const { data } = await supabase
                .from('players')
                .select('*')
                .eq('room_id', roomRow.id)
                .order('joined_at', { ascending: true })
              setPlayers(data as Player[] || [])
            }
          }
        )
        .subscribe()

      // Initial load of players
      const { data: initialPlayers } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomRow.id)
        .order('joined_at', { ascending: true })
      setPlayers(initialPlayers as Player[] || [])

      setLoading(false)
    }

    init()

    return () => {
      roomChannel?.unsubscribe()
      playersChannel?.unsubscribe()
    }
  }, [code])

  const startGame = async () => {
    if (!room) return
    const { error } = await supabase
      .from('rooms')
      .update({ state: 'reveal' })
      .eq('id', room.id)
    if (error) alert(error.message)
  }

  if (loading) return <p className="p-4">Loading room...</p>
  if (!room) return <p className="p-4">Room not found.</p>

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-6 bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-6 space-y-6">
        <h1 className="text-2xl font-bold text-center">Room {room.code}</h1>
        <p className="text-center text-gray-500">State: {room.state}</p>

        <div>
          <h2 className="font-semibold mb-2">Players</h2>
          <ul className="space-y-1">
            {players.map((p) => (
              <li key={p.id}>
                {p.name} {p.is_host ? '(Host)' : ''}
              </li>
            ))}
          </ul>
        </div>

        {/* Only the host can start the game */}
        {players.find((p) => p.is_host)?.user_id === userId && (
          <button
            onClick={startGame}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition"
          >
            Start Game
          </button>
        )}
      </div>
    </div>
  )
}
