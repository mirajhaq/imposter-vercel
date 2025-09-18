// src/lib/gameTypes.ts
export type Player = { id: string; name: string; role: 'player' | 'imposter' }
export type Step = 'setup' | 'reveal' | 'play' | 'complete'
