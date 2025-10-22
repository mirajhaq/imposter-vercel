// src/app/r/[code]/page.tsx
'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

import ThemeTile from '@/components/ThemeTile';
import ThemeEditorModal from '@/components/ThemeEditorModal';
import ImposterHintToggle from '@/components/ImposterHintToggle';
import ThemeHintToggle from '@/components/ThemeHintToggle';
import OnlinePlayScreen from '@/components/OnlinePlayScreen';

import { DEFAULT_WORDS, SPECIAL_WORDS } from '@/lib/words';

const ALL_THEMES = Array.from(new Set(DEFAULT_WORDS.map((w) => w.theme))).sort();
const SPECIAL_THEMES = Object.keys(SPECIAL_WORDS).sort();

type Player = {
  id: string;
  name: string;
  is_host: boolean;
  user_id: string;
  room_id: string;
};

type OnlineState = {
  selectedThemes: string[];
  imposterGetsHint: boolean;
  themeHintEnabled: boolean;
  phase?: 'reveal' | 'play';
  order?: string[];
  revealIndex?: number;
  starter?: string | null;
  // optional debug info:
  imposterUserId?: string;
  chosenWord?: { secret: string; hint: string; theme: string };
};

export default function RoomPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();

  const [meUserId, setMeUserId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [status, setStatus] = useState<'lobby' | 'playing' | 'ended'>('lobby');
  const [players, setPlayers] = useState<Player[]>([]);

  // Host-config + online flow state (mirrors room_state.state)
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [imposterGetsHint, setImposterGetsHint] = useState(false);
  const [themeHintEnabled, setThemeHintEnabled] = useState(false);

  const [phase, setPhase] = useState<'reveal' | 'play'>('reveal');
  const [order, setOrder] = useState<string[]>([]);
  const [revealIndex, setRevealIndex] = useState<number>(0);
  const [starter, setStarter] = useState<string | null>(null);

  const [showThemeEditor, setShowThemeEditor] = useState(false);
  const [busy, setBusy] = useState(false);

  // --- AUTH FIRST (RLS requires it)
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) await supabase.auth.signInAnonymously();
      const { data: s2 } = await supabase.auth.getSession();
      setMeUserId(s2.session?.user.id ?? null);
    })();
  }, []);

  // --- Initial load
  useEffect(() => {
    if (!meUserId || !code) return;

    (async () => {
      const { data: room, error } = await supabase
        .from('rooms')
        .select('id, status')
        .eq('code', String(code).toUpperCase())
        .maybeSingle();

      if (error || !room) {
        alert('Room not found');
        router.replace('/');
        return;
      }
      setRoomId(room.id);
      setStatus(room.status);

      const { data: list } = await supabase
        .from('room_players')
        .select('id, name, is_host, user_id, room_id')
        .eq('room_id', room.id)
        .order('joined_at', { ascending: true });

      setPlayers(list || []);

      const { data: st } = await supabase
        .from('room_state')
        .select('state')
        .eq('room_id', room.id)
        .maybeSingle();

      const s = (st?.state as OnlineState) || {};
      setSelectedThemes(Array.isArray(s.selectedThemes) ? s.selectedThemes : []);
      setImposterGetsHint(!!s.imposterGetsHint);
      setThemeHintEnabled(!!s.themeHintEnabled);
      if (s.phase) setPhase(s.phase);
      if (s.order) setOrder(s.order);
      if (typeof s.revealIndex === 'number') setRevealIndex(s.revealIndex);
      if (s.starter !== undefined) setStarter(s.starter ?? null);
    })();
  }, [meUserId, code, router]);

  // --- Realtime subscriptions (rooms, room_players, room_state)
  useEffect(() => {
    if (!roomId || !meUserId) return;

    const db = supabase
      .channel(`db:room:${roomId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        (payload: any) => setStatus(payload.new.status)
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'room_players', filter: `room_id=eq.${roomId}` },
        (payload: any) =>
          setPlayers((prev) => {
            const p = payload.new as Player;
            if (prev.some((x) => x.id === p.id)) return prev;
            return [...prev, p];
          })
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'room_players', filter: `room_id=eq.${roomId}` },
        (payload: any) =>
          setPlayers((prev) => {
            const p = payload.new as Player;
            const idx = prev.findIndex((x) => x.id === p.id);
            if (idx === -1) return prev;
            const next = prev.slice();
            next[idx] = p;
            return next;
          })
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'room_players', filter: `room_id=eq.${roomId}` },
        (payload: any) => setPlayers((prev) => prev.filter((x) => x.id !== (payload.old as Player).id))
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'room_state', filter: `room_id=eq.${roomId}` },
        (payload: any) => {
          const s = (payload.new.state as OnlineState) || {};
          setSelectedThemes(Array.isArray(s.selectedThemes) ? s.selectedThemes : []);
          setImposterGetsHint(!!s.imposterGetsHint);
          setThemeHintEnabled(!!s.themeHintEnabled);
          setPhase(s.phase ?? 'reveal');
          setOrder(s.order ?? []);
          setRevealIndex(s.revealIndex ?? 0);
          setStarter(s.starter ?? null);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'room_state', filter: `room_id=eq.${roomId}` },
        (payload: any) => {
          const s = (payload.new.state as OnlineState) || {};
          setSelectedThemes(Array.isArray(s.selectedThemes) ? s.selectedThemes : []);
          setImposterGetsHint(!!s.imposterGetsHint);
          setThemeHintEnabled(!!s.themeHintEnabled);
          setPhase(s.phase ?? 'reveal');
          setOrder(s.order ?? []);
          setRevealIndex(s.revealIndex ?? 0);
          setStarter(s.starter ?? null);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(db);
    };
  }, [roomId, meUserId]);

  const iAmHost = useMemo(() => {
    if (!meUserId) return false;
    return players.some((p) => p.user_id === meUserId && p.is_host);
  }, [players, meUserId]);

  // --- Host pushes setup changes into room_state
  const updateRoomState = useCallback(
    async (patch: Partial<OnlineState>) => {
      if (!roomId) return;
      setBusy(true);
      try {
        const newState: OnlineState = {
          selectedThemes,
          imposterGetsHint,
          themeHintEnabled,
          phase,
          order,
          revealIndex,
          starter,
          ...patch,
        };
        await supabase
          .from('room_state')
          .update({ state: newState, updated_at: new Date().toISOString() })
          .eq('room_id', roomId);
      } finally {
        setBusy(false);
      }
    },
    [roomId, selectedThemes, imposterGetsHint, themeHintEnabled, phase, order, revealIndex, starter]
  );

  const toggleTheme = (t: string) => {
    const next = selectedThemes.includes(t) ? selectedThemes.filter((x) => x !== t) : [...selectedThemes, t];
    setSelectedThemes(next);
    updateRoomState({ selectedThemes: next });
  };
  const onToggleImposterHint = (v: boolean) => {
    setImposterGetsHint(v);
    updateRoomState({ imposterGetsHint: v });
  };
  const onToggleThemeHint = (v: boolean) => {
    setThemeHintEnabled(v);
    updateRoomState({ themeHintEnabled: v });
  };

  // Helpers for word assignment
  const buildWordPool = (themes: string[]) => {
    const base = DEFAULT_WORDS.filter((w) => themes.length === 0 || themes.includes(w.theme));
    const specials = Object.entries(SPECIAL_WORDS)
      .filter(([theme]) => themes.includes(theme))
      .flatMap(([, arr]) => arr);
    return [...base, ...specials];
  };

  // --- Start game: assign one word to all, pick one imposter, init reveal state
  const startGame = async () => {
    if (!roomId || !code) return;
    setBusy(true);
    try {
      const list = players;
      if (list.length < 2) throw new Error('Need at least 2 players');

      // 1) Choose ONE word from the selected themes
      const pool = buildWordPool(selectedThemes);
      if (pool.length === 0) throw new Error('No words available for the selected themes');
      const chosen = pool[Math.floor(Math.random() * pool.length)];

      // 2) Choose ONE imposter at random
      const imposterUserId = list[Math.floor(Math.random() * list.length)].user_id;

      // 3) Build per-player secret payload from the single chosen word
      const secretsPayload = list.map((p) => {
        const isImp = p.user_id === imposterUserId;
        return {
          user_id: p.user_id,
          secret: isImp ? '' : chosen.secret,                                // players see the word
          hint: isImp && imposterGetsHint ? chosen.hint : '',                // imposter may see hint
          theme: isImp && themeHintEnabled ? chosen.theme : '',              // imposter may see theme
        };
      });

      // 4) Write secrets via SECURITY DEFINER RPC (RLS off inside)
      const { error: assignErr } = await supabase.rpc('assign_secrets', {
        room_code: String(code).toUpperCase(),
        secrets: secretsPayload,
      });
      if (assignErr) throw assignErr;

      // 5) Initialize reveal phase and persist chosenWord/imposter for reference
      const initState: OnlineState & {
        imposterUserId: string;
        chosenWord: { secret: string; hint: string; theme: string };
      } = {
        selectedThemes,
        imposterGetsHint,
        themeHintEnabled,
        phase: 'reveal',
        order: list.map((p) => p.user_id),
        revealIndex: 0,
        starter: null,
        imposterUserId,
        chosenWord: { secret: chosen.secret, hint: chosen.hint, theme: chosen.theme },
      };

      const { error } = await supabase.rpc('start_game', {
        room_code: String(code).toUpperCase(),
        new_state: initState,
      });
      if (error) throw error;
    } catch (e: any) {
      alert(e.message || 'Failed to start game');
    } finally {
      setBusy(false);
    }
  };

  // Host-only: restart lobby (clear state/secrets, keep players)
  const restartLobby = async () => {
    const { error } = await supabase.rpc('restart_lobby', { room_code: String(code).toUpperCase() });
    if (error) alert(error.message || 'Failed to restart');
  };

  if (!roomId) {
    return (
      <div className="min-h-screen grid place-items-center">
        <p>Loading room…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-100 to-gray-200 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="card p-4 sm:p-6">
          <h1 className="text-2xl font-bold text-center">Room {String(code).toUpperCase()}</h1>
        </div>

        {/* Players (realtime) */}
        <div className="card p-4 sm:p-6">
          <h2 className="text-lg font-semibold mb-3 text-center">Players</h2>
          <ul className="grid grid-cols-2 gap-2">
            {players.map((p) => (
              <li key={p.id} className="px-3 py-2 rounded bg-white shadow flex items-center justify-between">
                <span>{p.name}</span>
                {p.is_host && <span className="text-xs rounded px-2 py-1 bg-black text-white"> (Host)</span>}
              </li>
            ))}
          </ul>
          {players.length === 0 && (
            <p className="text-center text-sm text-gray-500 mt-2">Waiting for players…</p>
          )}
        </div>

        {/* Lobby / Playing / Ended */}
        {status === 'lobby' && (
          <div className="card p-4 sm:p-6 space-y-6">
            <h2 className="text-lg font-semibold text-center">Game Setup</h2>

            <div
              className={`cursor-pointer hover:shadow-md transition ${iAmHost ? '' : 'opacity-60 pointer-events-none'}`}
              onClick={() => iAmHost && setShowThemeEditor(true)}
            >
              <ThemeTile
                selectedThemes={selectedThemes}
                allThemes={ALL_THEMES}
                specialThemes={SPECIAL_THEMES}
                onClick={() => iAmHost && setShowThemeEditor(true)}
              />
              {!iAmHost && (
                <p className="text-xs text-center text-gray-500 mt-2">Only the host can edit themes.</p>
              )}
            </div>

            <div className={`flex flex-col sm:flex-row gap-4 justify-center ${iAmHost ? '' : 'opacity-60'}`}>
              <ImposterHintToggle
                imposterGetsHint={imposterGetsHint}
                setImposterGetsHint={iAmHost ? (v) => onToggleImposterHint(v) : () => {}}
              />
              <ThemeHintToggle
                themeHintEnabled={themeHintEnabled}
                setThemeHintEnabled={iAmHost ? (v) => onToggleThemeHint(v) : () => {}}
              />
            </div>

            {iAmHost ? (
              <div className="text-center">
                <button className="start-game-button" onClick={startGame} disabled={busy}>
                  Start Game
                </button>
              </div>
            ) : (
              <p className="text-center text-sm text-gray-500">Waiting for host to start…</p>
            )}
          </div>
        )}

        {status === 'playing' && (
          <OnlinePlayScreen
            roomId={roomId}
            roomCode={String(code).toUpperCase()}
            meUserId={meUserId!}
            players={players.map((p) => ({ user_id: p.user_id, name: p.name, is_host: p.is_host }))}
            state={{ selectedThemes, imposterGetsHint, themeHintEnabled, phase, order, revealIndex, starter }}
          />
        )}

        {status === 'ended' && (
          <div className="card p-4 sm:p-6 space-y-4 text-center">
            <h2 className="text-lg font-semibold">Game ended</h2>
            <p className="text-sm text-gray-600">You can restart with the same room.</p>
            {iAmHost ? (
              <button className="start-game-button" onClick={restartLobby}>
                Restart (back to lobby)
              </button>
            ) : (
              <p className="text-xs text-gray-500">Waiting for host to restart…</p>
            )}
          </div>
        )}
      </div>

      {showThemeEditor && iAmHost && (
        <ThemeEditorModal
          allThemes={ALL_THEMES}
          selectedThemes={selectedThemes}
          specialThemes={SPECIAL_THEMES}
          toggleTheme={toggleTheme}
          onClose={() => setShowThemeEditor(false)}
        />
      )}
    </div>
  );
}
