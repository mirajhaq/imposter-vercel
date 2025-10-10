'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { DEFAULT_WORDS, SPECIAL_WORDS, type WordPair } from '@/lib/words'
import RoomHeader from '@/components/online/RoomHeader'
import PlayersList from '@/components/online/PlayersList'
import HostSettings from '@/components/online/HostSettings'
import RevealCard from '@/components/online/RevealCard'

type Room = {
  id: string
  code: string
  state: 'setup' | 'reveal' | 'play' | 'complete'
  word_secret?: string | null
  word_hint?: string | null
  word_theme?: string | null
  imposter_gets_hint: boolean
  theme_hint_enabled: boolean
  selected_themes: string[]
  reveal_index: number
  starting_player_id: string | null
}

type Player = {
  id: string
  user_id: string
  name: string
  role: 'player' | 'imposter' | null
  is_host: boolean
  revealed: boolean
}

export default function RoomPage() {
  const params = useParams()
  const code = (params?.code as string).toUpperCase()

  const [room, setRoom] = useState<Room | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [myContent, setMyContent] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [openedThisTurn, setOpenedThisTurn] = useState(false)

  // host-editable local form state
  const [impHint, setImpHint] = useState(true)
  const [showTheme, setShowTheme] = useState(false)
  const [selThemes, setSelThemes] = useState<string[]>([])

  const allThemes: string[] = useMemo(() => {
    const base = new Set(DEFAULT_WORDS.map(w => w.theme))
    Object.keys(SPECIAL_WORDS).forEach(k => base.add(k))
    return Array.from(base).sort()
  }, [])

  const myPlayer = useMemo(
    () => players.find(p => p.user_id === userId) ?? null,
    [players, userId]
  )

  const orderedPlayers = players // already ordered by joined_at in queries
  const iAmHost = players.find(p => p.is_host)?.user_id === userId

  const currentIndex = room?.reveal_index ?? 0
  const currentPlayer = orderedPlayers[currentIndex] || null
  const isMyTurn = !!(currentPlayer && currentPlayer.user_id === userId)

  // user id
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data?.user?.id ?? null)
    })
  }, [])

  // fetch + subscribe
  useEffect(() => {
    let roomChannel: { unsubscribe: () => void } | null = null
    let playersChannel: { unsubscribe: () => void } | null = null

    async function init() {
      const { data: roomRow, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', code)
        .single()

      if (roomError || !roomRow) {
        console.error(roomError)
        setLoading(false)
        return
      }

      setRoom(roomRow as Room)
      setImpHint(!!roomRow.imposter_gets_hint)
      setShowTheme(!!roomRow.theme_hint_enabled)
      setSelThemes(Array.isArray(roomRow.selected_themes) ? roomRow.selected_themes : [])

      roomChannel = supabase
        .channel(`room-${roomRow.id}`)
        .on(
          'postgres_changes' as any,
          { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomRow.id}` },
          (payload: { new: Room }) => {
            setRoom(payload.new)
            setImpHint(payload.new.imposter_gets_hint)
            setShowTheme(payload.new.theme_hint_enabled)
            setSelThemes(payload.new.selected_themes || [])
          }
        )
        .subscribe()

      playersChannel = supabase
        .channel(`players-${roomRow.id}`)
        .on(
          'postgres_changes' as any,
          { event: '*', schema: 'public', table: 'players' },
          async (payload: { new?: { room_id?: string } }) => {
            if (payload.new?.room_id === roomRow.id) {
              const { data } = await supabase
                .from('players')
                .select('*')
                .eq('room_id', roomRow.id)
                .order('joined_at', { ascending: true })
              setPlayers((data as Player[]) || [])
            }
          }
        )
        .subscribe()

      const { data: initialPlayers } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomRow.id)
        .order('joined_at', { ascending: true })
      setPlayers((initialPlayers as Player[]) || [])

      setLoading(false)
    }

    init()
    return () => {
      roomChannel?.unsubscribe()
      playersChannel?.unsubscribe()
    }
  }, [code])

  // When entering reveal, reset local "opened" flag
  useEffect(() => {
    if (room?.state === 'reveal') {
      setOpenedThisTurn(false)
    }
  }, [room?.state, currentIndex])

  // my secret/hint during reveal
  useEffect(() => {
    if (!room || room.state !== 'reveal' || !userId) return
    const roomId = room.id
    let cancelled = false

    async function loadMyContent() {
      const { data, error } = await supabase
        .from('player_secrets')
        .select('content')
        .eq('room_id', roomId)
        .eq('user_id', userId)
        .maybeSingle<{ content: string }>()

      if (!cancelled) {
        if (error) {
          console.warn('Failed to fetch my player_secrets row', error)
          setMyContent(null)
        } else {
          setMyContent(data?.content ?? null)
        }
      }
    }

    loadMyContent()
    return () => {
      cancelled = true
    }
  }, [room?.state, room?.id, userId])

  const saveSettings = async () => {
    if (!room) return
    try {
      setBusy(true)
      const { error } = await supabase
        .from('rooms')
        .update({
          imposter_gets_hint: impHint,
          theme_hint_enabled: showTheme,
          selected_themes: selThemes,
        })
        .eq('id', room.id)
      if (error) throw error
    } catch (e: any) {
      alert(e?.message || 'Failed to save settings')
    } finally {
      setBusy(false)
    }
  }

  function pickWordPairFromSettings(): WordPair {
    let pool: WordPair[] = []
    if (selThemes.length) {
      pool = DEFAULT_WORDS.filter(w => selThemes.includes(w.theme))
      selThemes.forEach(t => {
        if ((SPECIAL_WORDS as Record<string, WordPair[]>)[t]) {
          pool = pool.concat((SPECIAL_WORDS as Record<string, WordPair[]>)[t])
        }
      })
    } else {
      pool = DEFAULT_WORDS
    }
    if (!pool.length) pool = DEFAULT_WORDS
    return pool[Math.floor(Math.random() * pool.length)]
  }

  async function fetchPlayersForRoom(roomId: string) {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('room_id', roomId)
      .order('joined_at', { ascending: true })
    if (error) throw error
    return (data as Player[]) || []
  }

  const startGame = async () => {
    if (!room) return
    try {
      setBusy(true)

      const currentPlayers = await fetchPlayersForRoom(room.id)
      if (!currentPlayers.length) return

      const impIndex = Math.floor(Math.random() * currentPlayers.length)
      const chosen = pickWordPairFromSettings()

      // Reset flags
      const resetFlags = currentPlayers.map(p =>
        supabase.from('players').update({ revealed: false }).eq('id', p.id)
      )
      await Promise.all(resetFlags)

      // Set roles
      const roleUpdates = currentPlayers.map((p, idx) =>
        supabase.from('players').update({ role: idx === impIndex ? 'imposter' : 'player' }).eq('id', p.id)
      )
      const roleResults = await Promise.all(roleUpdates)
      const roleErr = roleResults.find(r => (r as any).error)?.error
      if (roleErr) throw roleErr

      // Set room state + words + reset reveal_index
      const { error: roomErr } = await supabase
        .from('rooms')
        .update({
          word_secret: chosen.secret,
          word_hint: chosen.hint,
          word_theme: chosen.theme,
          state: 'reveal',
          imposter_gets_hint: impHint,
          theme_hint_enabled: showTheme,
          selected_themes: selThemes,
          reveal_index: 0,
          starting_player_id: null
        })
        .eq('id', room.id)
      if (roomErr) throw roomErr

      // Insert per-player secrets
      const secretRows = currentPlayers.map((p, idx) => ({
        player_id: p.id,
        user_id: p.user_id,
        room_id: room.id,
        content: idx === impIndex ? (impHint ? chosen.hint : '') : chosen.secret,
      }))
      const { error: secErr } = await supabase.from('player_secrets').insert(secretRows)
      if (secErr) throw secErr
    } catch (e: any) {
      alert(e?.message || 'Failed to start game')
    } finally {
      setBusy(false)
    }
  }

  const revealMyTurn = async () => {
    if (!room || !myPlayer) return
    if (!currentPlayer || currentPlayer.id !== myPlayer.id) {
      alert('Not your turn yet!')
      return
    }

    try {
      setBusy(true)

      const { error: r1 } = await supabase
        .from('players')
        .update({ revealed: true })
        .eq('id', myPlayer.id)
      if (r1) throw r1

      if (myContent == null) {
        const { data, error } = await supabase
          .from('player_secrets')
          .select('content')
          .eq('room_id', room.id)
          .eq('user_id', myPlayer.user_id)
          .maybeSingle<{ content: string }>()
        if (error) throw error
        setMyContent(data?.content ?? '')
      }

      setOpenedThisTurn(true)
    } catch (e: any) {
      alert(e?.message || 'Failed to reveal')
    } finally {
      setBusy(false)
    }
  }

  const doneViewing = async () => {
    if (!room || !myPlayer) return
    const expected = room.reveal_index
    if (!currentPlayer || currentPlayer.id !== myPlayer.id) return

    try {
      setBusy(true)

      const lastIndex = orderedPlayers.length - 1
      const isLastRevealer = expected >= lastIndex

      if (!isLastRevealer) {
        const { data: updatedRoom, error: advanceErr } = await supabase
          .from('rooms')
          .update({ reveal_index: expected + 1 })
          .eq('id', room.id)
          .eq('reveal_index', expected)
          .select('*')
          .maybeSingle<Room>()
        if (advanceErr) throw advanceErr
        if (!updatedRoom) return
      } else {
        const randIdx = Math.floor(Math.random() * orderedPlayers.length)
        const starter = orderedPlayers[randIdx]
        const { data: updatedRoom, error: playErr } = await supabase
          .from('rooms')
          .update({
            reveal_index: expected + 1,
            state: 'play',
            starting_player_id: starter.id
          })
          .eq('id', room.id)
          .eq('reveal_index', expected)
          .select('*')
          .maybeSingle<Room>()
        if (playErr) throw playErr
        if (!updatedRoom) return
      }

      setOpenedThisTurn(false)
    } catch (e: any) {
      alert(e?.message || 'Failed to continue')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <p className="p-4">Loading room...</p>
  if (!room) return <p className="p-4">Room not found.</p>

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-6 bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-6 space-y-6">
        <RoomHeader code={room.code} state={room.state} />

        <PlayersList
          players={players}
          currentPlayerId={currentPlayer?.id || null}
          meUserId={userId}
        />

        {/* Host settings in setup */}
        {room.state === 'setup' && (
          <>
            <HostSettings
              isHost={iAmHost}
              busy={busy}
              impHint={impHint}
              setImpHint={setImpHint}
              showTheme={showTheme}
              setShowTheme={setShowTheme}
              allThemes={allThemes}
              selThemes={selThemes}
              setSelThemes={setSelThemes}
              onSave={saveSettings}
            />

            {iAmHost && (
              <button
                onClick={startGame}
                disabled={busy}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition disabled:opacity-60"
              >
                {busy ? 'Starting…' : 'Start Game'}
              </button>
            )}
          </>
        )}

        {/* Reveal phase — one-by-one */}
        {room.state === 'reveal' && (
          <RevealCard
            isMyTurn={isMyTurn}
            waitingForName={currentPlayer?.name || ''}
            content={openedThisTurn ? myContent : null}
            themeLabel={room.word_theme ?? null}
            showTheme={room.theme_hint_enabled}
            revealed={!!myPlayer?.revealed}
            busy={busy}
            onReveal={revealMyTurn}
            onDone={doneViewing}
          />
        )}

        {/* Play phase — who starts */}
        {room.state === 'play' && (
          <div className="p-4 border rounded-md bg-gray-50 text-center">
            {room.starting_player_id
              ? <p className="text-lg">This player starts: <strong>{players.find(p => p.id === room.starting_player_id)?.name ?? '—'}</strong></p>
              : <p className="text-lg">Starting player will be selected…</p>}
          </div>
        )}
      </div>
    </div>
  )
}
