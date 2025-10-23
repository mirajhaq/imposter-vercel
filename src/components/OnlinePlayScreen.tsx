// src/components/OnlinePlayScreen.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type OnlineState = {
  selectedThemes: string[];
  imposterGetsHint: boolean;
  themeHintEnabled: boolean;
  phase?: 'reveal' | 'play';
  order?: string[];
  revealIndex?: number;
  starter?: string | null;
  // (optional) imposterUserId?: string
};

type PlayerLite = { user_id: string; name: string; is_host: boolean };

type Props = {
  roomId: string;
  roomCode: string;
  meUserId: string;
  players: PlayerLite[];
  state: OnlineState; // live via room_state subscription in page
};

export default function OnlinePlayScreen({ roomId, roomCode, meUserId, players, state }: Props) {
  const [mySecret, setMySecret] = useState<{ secret: string; hint: string; theme: string } | null>(null);
  const [revealed, setRevealed] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const iAmHost = useMemo(
    () => players.some((p) => p.user_id === meUserId && p.is_host),
    [players, meUserId]
  );

  const turnUserId = state.order?.[state.revealIndex ?? 0] ?? null;
  const isMyTurn = state.phase === 'reveal' && turnUserId === meUserId;

  // Map for quick lookup
  const playerById = useMemo(() => {
    const m = new Map<string, PlayerLite>();
    players.forEach((p) => m.set(p.user_id, p));
    return m;
  }, [players]);

  // Starter-first order for play phase
  const playOrder = useMemo(() => {
    const base = state.order ?? [];
    if (base.length === 0) return [];
    if (!state.starter) return base; // fallback: show original order
    const idx = base.indexOf(state.starter);
    if (idx === -1) return base;
    return [...base.slice(idx), ...base.slice(0, idx)];
  }, [state.order, state.starter]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('room_player_secrets')
        .select('secret,hint,theme')
        .eq('room_id', roomId)
        .eq('user_id', meUserId)
        .maybeSingle();
      if (data) setMySecret(data);
    })();
  }, [roomId, meUserId]);

  useEffect(() => {
    setRevealed(false);
  }, [turnUserId]);

  useEffect(() => {
    const ch = supabase.channel(`reveal:${roomId}`, { config: { broadcast: { self: true } } });
    channelRef.current = ch;

    ch.on('broadcast', { event: 'reveal_ready' }, async (payload) => {
      if (!iAmHost || state.phase !== 'reveal') return;

      const readyUserId = payload?.payload?.user_id as string | undefined;
      const idx = (state.order ?? []).indexOf(readyUserId ?? '');
      if (idx !== (state.revealIndex ?? -1)) return;

      const nextIndex = (state.revealIndex ?? 0) + 1;
      if (nextIndex < (state.order?.length ?? 0)) {
        await supabase
          .from('room_state')
          .update({
            state: { ...state, revealIndex: nextIndex },
            updated_at: new Date().toISOString(),
          })
          .eq('room_id', roomId);
      } else {
        const order = state.order ?? [];
        const starter = order[Math.floor(Math.random() * order.length)] ?? null;
        await supabase
          .from('room_state')
          .update({
            state: { ...state, phase: 'play', starter },
            updated_at: new Date().toISOString(),
          })
          .eq('room_id', roomId);
      }
    });

    ch.subscribe();
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, iAmHost, state]);

  const sendReady = async () => {
    if (!channelRef.current) return;
    await channelRef.current.send({
      type: 'broadcast',
      event: 'reveal_ready',
      payload: { user_id: meUserId, at: Date.now() },
    });
  };

  const endGame = async () => {
    // host only
    const { error } = await supabase.rpc('end_game', { room_code: roomCode.toUpperCase() });
    if (error) alert(error.message || 'Failed to end game');
  };

  // -------- UI --------
  if (state.phase === 'reveal') {
    const currentPlayer = players.find((p) => p.user_id === turnUserId);
    return (
      <div className="card p-4 sm:p-6 space-y-4 text-center">
        <h2 className="text-lg font-semibold">Reveal Phase</h2>

        <p className="text-sm text-gray-600">
          {isMyTurn
            ? 'It’s your turn. Reveal your word privately on your device.'
            : `Waiting for ${currentPlayer?.name ?? 'someone'} to reveal…`}
        </p>

        {isMyTurn && (
          <div className="space-y-3">
            {revealed && (
              <div className="bg-white shadow rounded-2xl p-4 text-left max-w-sm mx-auto">
                {mySecret?.secret ? (
                  <div className="text-2xl font-bold mt-1">{mySecret.secret}</div>
                ) : (
                  <>
                    <div className="text-xs uppercase tracking-wide text-gray-500">Imposter</div>
                    {mySecret?.hint ? (
                      <div className="text-sm text-gray-700 mt-1">Hint: {mySecret.hint}</div>
                    ) : (
                      <div className="text-sm text-gray-500 mt-1">No hint</div>
                    )}
                    {mySecret?.theme ? (
                      <div className="text-sm text-gray-700 mt-1">Theme: {mySecret.theme}</div>
                    ) : null}
                  </>
                )}
              </div>
            )}

            {!revealed ? (
              <button className="start-game-button" onClick={() => setRevealed(true)} disabled={!mySecret}>
                Reveal my word
              </button>
            ) : (
              <button className="start-game-button" onClick={sendReady}>
                I’m done — next
              </button>
            )}
          </div>
        )}

        <ul className="grid grid-cols-2 gap-2 mt-4">
          {(state.order ?? []).map((uid, i) => {
            const p = playerById.get(uid);
            const isNow = i === (state.revealIndex ?? 0);
            return (
              <li
                key={uid}
                className={`px-3 py-2 rounded shadow ${isNow ? 'bg-black text-white' : 'bg-white'}`}
              >
                {p?.name ?? 'Player'}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  if (state.phase === 'play') {
    const starterName = players.find((p) => p.user_id === state.starter)?.name ?? 'Someone';

    return (
      <div className="card p-4 sm:p-6 space-y-4 text-center">
        <h2 className="text-lg font-semibold">Let’s play!</h2>
        <p className="text-sm text-gray-600">
          Starting player: <b>{starterName}</b>
        </p>

        {/* Turn order list (starter first, then clockwise) */}
        <ul className="mt-2 space-y-2 max-w-sm mx-auto text-left">
          {playOrder.map((uid, idx) => {
            const p = playerById.get(uid);
            return (
              <li
                key={uid}
                className={`px-3 py-2 rounded shadow flex items-center justify-between ${
                  idx === 0 ? 'bg-black text-white' : 'bg-white'
                }`}
              >
                <span className="font-medium">{p?.name ?? 'Player'}</span>
                {idx === 0 && <span className="ml-2 text-xs opacity-80"></span>}
              </li>
            );
          })}
        </ul>

        {/* Host-only End Game button during play */}
        {iAmHost && (
          <div className="mt-3">
            <button 
              className="end-game-button" onClick={endGame}>
              End Game
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="card p-4 sm:p-6 text-center">
      <p className="text-sm text-gray-600">Waiting for host…</p>
    </div>
  );
}

