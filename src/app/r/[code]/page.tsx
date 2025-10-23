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
  imposterUserId?: string;
  chosenWord?: { secret: string; hint: string; theme: string };
};

// ---- Local name storage helpers (localStorage, with cookie fallback) ----
const NAME_KEY = 'party_name';
const getStoredName = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    const v = localStorage.getItem(NAME_KEY);
    if (v) return v;
    const m = document.cookie.match(new RegExp('(^| )' + NAME_KEY + '=([^;]+)'));
    return m ? decodeURIComponent(m[2]) : null;
  } catch {
    return null;
  }
};
const setStoredName = (name: string) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(NAME_KEY, name);
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    document.cookie = `${NAME_KEY}=${encodeURIComponent(name)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  } catch {}
};

// ---- Lightweight inline modal for name capture/change (styled via global.css) ----
function NameModal({
  initial,
  onSubmit,
  onClose,
  title = 'Set your name',
}: {
  initial?: string;
  onSubmit: (name: string) => void;
  onClose?: () => void;
  title?: string;
}) {
  const [name, setName] = useState(initial ?? '');
  const canSave = name.trim().length > 0 && name.trim().length <= 30;

  // Accessibility niceties
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) onClose();
      if ((e.key === 'Enter' || e.key === 'NumpadEnter') && canSave) onSubmit(name.trim());
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [canSave, name, onClose, onSubmit]);

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div className="modal-card">
        <div className="modal-content">
          {/* Header */}
          <div className="modal-header">
            <h3 className="modal-title">{title}</h3>
            {onClose && (
              <button className="modal-close" onClick={onClose} aria-label="Close">
                ×
              </button>
            )}
          </div>

          {/* Input */}
          <input
            className="modal-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alex"
            maxLength={30}
            autoFocus
          />

          {/* Actions */}
          <div className="modal-actions">
            {onClose && (
              <button className="modal-cancel-button" onClick={onClose}>
                Cancel
              </button>
            )}
            <button
              className="modal-save-button"
              onClick={() => onSubmit(name.trim())}
              disabled={!canSave}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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

  const [imposterUserId, setImposterUserId] = useState<string | null>(null);

  // name modal state
  const [showNameModal, setShowNameModal] = useState(false);
  const [editingName, setEditingName] = useState(false);

  // ---- single source of truth for player ordering ----
  const sortPlayers = useCallback((arr: Player[]) => {
    return [...arr].sort((a, b) => a.id.localeCompare(b.id));
  }, []);

  // --- AUTH FIRST (RLS requires it)
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) await supabase.auth.signInAnonymously();
      const { data: s2 } = await supabase.auth.getSession();
      setMeUserId(s2.session?.user.id ?? null);
    })();
  }, []);

  // Utility: ensure I'm a member of this room (DB-level check/insert)
  const ensureSelfMembership = useCallback(
    async (rid: string) => {
      if (!meUserId) return;
      // Check DB directly (don’t rely on local state)
      const { data: existing } = await supabase
        .from('room_players')
        .select('id')
        .eq('room_id', rid)
        .eq('user_id', meUserId)
        .maybeSingle();

      if (existing) return;

      const stored = (getStoredName() || 'Player').trim();
      // If no stored name, show modal to capture it before we can see others (due to RLS)
      if (!stored) {
        setShowNameModal(true);
        return;
      }

      const { error: insertErr } = await supabase
        .from('room_players')
        .insert({ room_id: rid, user_id: meUserId, name: stored, is_host: false });

      // ignore unique race (e.g., parallel tab)
      if (insertErr && (insertErr as any).code !== '23505') {
        // optional: console.warn(insertErr);
      }
    },
    [meUserId]
  );

  // --- Initial load (fix order: find room -> ensure membership -> then load lists) ---
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

      // CRITICAL: ensure I'm a member BEFORE selecting players (so RLS will allow seeing others)
      await ensureSelfMembership(room.id);

      // Now load players and state (ordered + sorted)
      const { data: list } = await supabase
        .from('room_players')
        .select('id, name, is_host, user_id, room_id')
        .eq('room_id', room.id)
        .order('id', { ascending: true });

      setPlayers(sortPlayers(list || []));

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
      if (s.imposterUserId !== undefined) setImposterUserId(s.imposterUserId ?? null);

      // Store my DB name for next time if missing locally
      const meRow = (list || []).find((p) => p.user_id === meUserId);
      if (meRow && !getStoredName()) setStoredName(meRow.name);
    })();
  }, [meUserId, code, router, ensureSelfMembership, sortPlayers]);

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
            if (p.user_id === meUserId && !getStoredName()) setStoredName(p.name);
            return sortPlayers([...prev, p]);
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
            if (p.user_id === meUserId) setStoredName(p.name);
            return sortPlayers(next);
          })
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'room_players', filter: `room_id=eq.${roomId}` },
        (payload: any) => setPlayers((prev) => sortPlayers(prev.filter((x) => x.id !== (payload.old as Player).id)))
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
          setImposterUserId(s.imposterUserId ?? null);
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
          setImposterUserId(s.imposterUserId ?? null);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(db);
    };
  }, [roomId, meUserId, sortPlayers]);

  const iAmHost = useMemo(() => {
    if (!meUserId) return false;
    return players.some((p) => p.user_id === meUserId && p.is_host);
  }, [players, meUserId]);

  const mePlayerRow = useMemo(
    () => players.find((p) => p.user_id === meUserId) || null,
    [players, meUserId]
  );

  // --- Leave room helper (manual via button) ---
  const leaveRoom = useCallback(async () => {
    if (!roomId || !meUserId) return;
    try {
      await supabase
        .from('room_players')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', meUserId);
    } catch {
      // ignore
    }
  }, [roomId, meUserId]);

  // --- Ensure membership (reinsert if missing when tab returns) ---
  const ensureMembershipOnReturn = useCallback(async () => {
    if (!roomId || !meUserId) return;
    const { data: existing } = await supabase
      .from('room_players')
      .select('id')
      .eq('room_id', roomId)
      .eq('user_id', meUserId)
      .maybeSingle();
    if (existing) return;

    const stored = (getStoredName() || 'Player').trim();
    await supabase
      .from('room_players')
      .insert({ room_id: roomId, user_id: meUserId, name: stored, is_host: false })
      .then(({ error }) => {
        if (error && (error as any).code !== '23505') {
          // optional: console.warn(error);
        }
      });
  }, [roomId, meUserId]);

  // Presence/visibility only (no deleting on refresh)
  useEffect(() => {
    if (!roomId || !meUserId) return;

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void ensureMembershipOnReturn();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [roomId, meUserId, ensureMembershipOnReturn]);

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
          imposterUserId: imposterUserId ?? undefined,
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
    [roomId, selectedThemes, imposterGetsHint, themeHintEnabled, phase, order, revealIndex, starter, imposterUserId]
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
          secret: isImp ? '' : chosen.secret,
          hint: isImp && imposterGetsHint ? chosen.hint : '',
          theme: isImp && themeHintEnabled ? chosen.theme : '',
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

  // Change my name (UI + DB + local storage)
  const changeMyName = async (newName: string) => {
    if (!roomId || !meUserId) return;
    setStoredName(newName);
    if (mePlayerRow) {
      await supabase.from('room_players').update({ name: newName }).eq('id', mePlayerRow.id);
    } else {
      await supabase
        .from('room_players')
        .insert({ room_id: roomId, user_id: meUserId, name: newName, is_host: false });
    }
    setShowNameModal(false);
    setEditingName(false);
  };

  const onMyTileClick = () => {
    setEditingName(true);
    setShowNameModal(true);
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
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-2xl font-bold text-center flex-1">
              Room {String(code).toUpperCase()}
            </h1>
            {/* Leave room */}
            <button
              className="text-sm px-3 py-1 rounded-lg border"
              onClick={() => leaveRoom().then(() => router.replace('/'))}
              title="Leave room"
            >
              Leave
            </button>
          </div>
        </div>

        {/* Players (tiles) */}
        <div className="card p-4 sm:p-6">
          <h2 className="text-lg font-semibold mb-3 text-center">Players</h2>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
            {players.map((p) => {
              const mine = p.user_id === meUserId;
              const onClick = mine ? onMyTileClick : undefined;

              return (
                <button
                  key={p.id}
                  onClick={onClick}
                  title={mine ? 'Click to edit your name' : undefined}
                  style={{
                    all: 'unset',
                    cursor: mine ? 'pointer' : 'default',
                    display: 'inline-block',
                    margin: '0.25rem',
                  }}
                  onKeyDown={(e) => {
                    if (mine && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      onMyTileClick();
                    }
                  }}
                >
                  <div
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: mine ? '#99fafaa8' : '#3f8d97ff', // Green for you, blue for others
                      borderRadius: '8px',
                      border: '2px solid rgba(167, 167, 167, 1)',
                      minWidth: '80px',
                      textAlign: 'center',
                      boxShadow: mine ? '0 0 0 2px rgba(0,0,0,0.1) inset' : undefined,
                    }}
                  >
                    <span style={{ color: '#000', fontWeight: 550 }}>
                      {p.name}
                      {p.is_host ? ' (Host)' : ''}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

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
            <p className="text-sm">
              Imposter: <b>{players.find((p) => p.user_id === imposterUserId)?.name ?? 'Unknown'}</b>
            </p>
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

      {/* Name capture/change modal (if no stored name at refresh-time membership check) */}
      {showNameModal && (
        <NameModal
          title={editingName ? 'Change your name' : 'Set your name to join'}
          initial={editingName ? (mePlayerRow?.name ?? getStoredName() ?? '') : (getStoredName() ?? '')}
          onSubmit={async (name) => {
            setStoredName(name);
            if (roomId && meUserId) {
              // join (or update) then reload the player list so RLS allows full visibility
              const { data: existing } = await supabase
                .from('room_players')
                .select('id')
                .eq('room_id', roomId)
                .eq('user_id', meUserId)
                .maybeSingle();
              if (existing) {
                await supabase.from('room_players').update({ name }).eq('id', existing.id);
              } else {
                await supabase.from('room_players').insert({
                  room_id: roomId,
                  user_id: meUserId,
                  name,
                  is_host: false,
                });
              }
              // fetch players after joining to populate everyone (RLS) — always ordered + sorted
              const { data: list } = await supabase
                .from('room_players')
                .select('id, name, is_host, user_id, room_id')
                .eq('room_id', roomId)
                .order('id', { ascending: true });
              setPlayers(sortPlayers(list || []));
            }
            setShowNameModal(false);
            setEditingName(false);
          }}
          onClose={editingName ? () => { setShowNameModal(false); setEditingName(false); } : undefined}
        />
      )}
    </div>
  );
}
