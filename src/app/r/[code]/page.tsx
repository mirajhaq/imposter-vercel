// src/app/r/[code]/page.tsx
'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

import ThemeTile from '@/components/ThemeTile';
import ThemeEditorModal from '@/components/ThemeEditorModal';
import ImposterHintToggle from '@/components/ImposterHintToggle';
import ThemeHintToggle from '@/components/ThemeHintToggle';

import { DEFAULT_WORDS, SPECIAL_WORDS } from '@/lib/words';

const ALL_THEMES = Array.from(new Set(DEFAULT_WORDS.map(w => w.theme))).sort();
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
};

export default function RoomPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();

  const [meUserId, setMeUserId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [status, setStatus] = useState<'lobby' | 'playing' | 'ended'>('lobby');
  const [players, setPlayers] = useState<Player[]>([]);

  // Host-config (mirrors room_state.state)
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [imposterGetsHint, setImposterGetsHint] = useState(false);
  const [themeHintEnabled, setThemeHintEnabled] = useState(false);

  const [showThemeEditor, setShowThemeEditor] = useState(false);
  const [busy, setBusy] = useState(false);

  // 1) Ensure anon auth before any reads/subscriptions (RLS-safe)
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) await supabase.auth.signInAnonymously();
      const { data: s2 } = await supabase.auth.getSession();
      setMeUserId(s2.session?.user.id ?? null);
    })();
  }, []);

  // 2) Initial load once we have auth
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

      // players
      const { data: list } = await supabase
        .from('room_players')
        .select('id, name, is_host, user_id, room_id')
        .eq('room_id', room.id)
        .order('joined_at', { ascending: true });

      setPlayers(list || []);

      // state
      const { data: st } = await supabase
        .from('room_state')
        .select('state')
        .eq('room_id', room.id)
        .maybeSingle();

      const s = (st?.state as OnlineState) || {};
      setSelectedThemes(Array.isArray(s.selectedThemes) ? s.selectedThemes : []);
      setImposterGetsHint(!!s.imposterGetsHint);
      setThemeHintEnabled(!!s.themeHintEnabled);
    })();
  }, [meUserId, code, router]);

  // 3) Realtime: presence + postgres_changes
  useEffect(() => {
    if (!roomId || !meUserId) return;

    // A) Presence (bonus UI feel; includes my name so others can show "online now")
    const me = players.find(p => p.user_id === meUserId);
    const presence = supabase.channel(`presence:room:${roomId}`, {
      config: { presence: { key: meUserId } },
    });

    presence
      .on('presence', { event: 'sync' }, () => {
        // no-op; could read presence state here if you want "online dots"
      })
      .subscribe(status => {
        if (status === 'SUBSCRIBED') {
          presence.track({
            user_id: meUserId,
            name: me?.name ?? 'Player',
            online_at: new Date().toISOString(),
          });
        }
      });

    // Helpers to upsert/remove in local state without refetch
    const upsertPlayer = (p: Player) =>
      setPlayers(prev => {
        const idx = prev.findIndex(x => x.id === p.id);
        if (idx === -1) return [...prev, p].sort((a, b) => a.name.localeCompare(b.name));
        const next = prev.slice();
        next[idx] = p;
        return next;
      });

    const removePlayer = (id: string) =>
      setPlayers(prev => prev.filter(x => x.id !== id));

    // B) DB change streams
    const db = supabase
      .channel(`db:room:${roomId}`)

      // rooms status (start/end)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        (payload: any) => setStatus(payload.new.status))

      // players: INSERT/UPDATE/DELETE
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'room_players', filter: `room_id=eq.${roomId}` },
        (payload: any) => {
          const p = payload.new as Player;
          upsertPlayer(p);
        })
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'room_players', filter: `room_id=eq.${roomId}` },
        (payload: any) => {
          const p = payload.new as Player;
          upsertPlayer(p);
        })
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'room_players', filter: `room_id=eq.${roomId}` },
        (payload: any) => {
          const oldRow = payload.old as Player;
          removePlayer(oldRow.id);
        })

      // room_state: INSERT/UPDATE (host options)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'room_state', filter: `room_id=eq.${roomId}` },
        (payload: any) => {
          const s = (payload.new.state as OnlineState) || {};
          setSelectedThemes(Array.isArray(s.selectedThemes) ? s.selectedThemes : []);
          setImposterGetsHint(!!s.imposterGetsHint);
          setThemeHintEnabled(!!s.themeHintEnabled);
        })
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'room_state', filter: `room_id=eq.${roomId}` },
        (payload: any) => {
          const s = (payload.new.state as OnlineState) || {};
          setSelectedThemes(Array.isArray(s.selectedThemes) ? s.selectedThemes : []);
          setImposterGetsHint(!!s.imposterGetsHint);
          setThemeHintEnabled(!!s.themeHintEnabled);
        })

      .subscribe();

    return () => {
      supabase.removeChannel(db);
      supabase.removeChannel(presence);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, meUserId]); // (don't depend on players here; presence payload uses latest name next render)

  const iAmHost = useMemo(() => {
    if (!meUserId) return false;
    return players.some(p => p.user_id === meUserId && p.is_host);
  }, [players, meUserId]);

  // Host: push setup changes to room_state
  const updateRoomState = useCallback(
    async (patch: Partial<OnlineState>) => {
      if (!roomId) return;
      setBusy(true);
      try {
        const newState: OnlineState = {
          selectedThemes,
          imposterGetsHint,
          themeHintEnabled,
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
    [roomId, selectedThemes, imposterGetsHint, themeHintEnabled]
  );

  const toggleTheme = (t: string) => {
    const next = selectedThemes.includes(t)
      ? selectedThemes.filter(x => x !== t)
      : [...selectedThemes, t];
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

  const startGame = async () => {
    if (!code) return;
    setBusy(true);
    try {
      const snapshot: OnlineState = { selectedThemes, imposterGetsHint, themeHintEnabled };
      const { error } = await supabase.rpc('start_game', {
        room_code: String(code).toUpperCase(),
        new_state: snapshot,
      });
      if (error) throw error;
      // status flips via realtime
    } catch (e: any) {
      alert(e.message || 'Failed to start game');
    } finally {
      setBusy(false);
    }
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
                {p.is_host && <span className="text-xs rounded px-2 py-1 bg-black text-white">Host</span>}
              </li>
            ))}
          </ul>
          {players.length === 0 && (
            <p className="text-center text-sm text-gray-500 mt-2">Waiting for players…</p>
          )}
        </div>

        {/* Host setup (themes + hint toggles) */}
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
                setImposterGetsHint={iAmHost ? onToggleImposterHint : () => {}}
              />
              <ThemeHintToggle
                themeHintEnabled={themeHintEnabled}
                setThemeHintEnabled={iAmHost ? onToggleThemeHint : () => {}}
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
          <div className="card p-4 sm:p-6 text-center">
            <p className="text-sm text-gray-600">Game in progress…</p>
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
