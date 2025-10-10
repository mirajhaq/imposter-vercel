'use client'
import React from 'react'

type Props = {
  isHost: boolean
  busy: boolean
  impHint: boolean
  setImpHint: (v: boolean) => void
  showTheme: boolean
  setShowTheme: (v: boolean) => void
  allThemes: string[]
  selThemes: string[]
  setSelThemes: (themes: string[]) => void
  onSave: () => void
}

export default function HostSettings({
  isHost,
  busy,
  impHint,
  setImpHint,
  showTheme,
  setShowTheme,
  allThemes,
  selThemes,
  setSelThemes,
  onSave,
}: Props) {
  return (
    <div className="p-4 border rounded-md bg-gray-50 space-y-4">
      <h3 className="font-semibold">Settings</h3>

      <div className="flex items-center gap-2">
        <input
          id="impHint"
          type="checkbox"
          checked={impHint}
          onChange={(e) => setImpHint(e.target.checked)}
          disabled={!isHost}
        />
        <label htmlFor="impHint">Imposter gets hint</label>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="showTheme"
          type="checkbox"
          checked={showTheme}
          onChange={(e) => setShowTheme(e.target.checked)}
          disabled={!isHost}
        />
        <label htmlFor="showTheme">Show theme during reveal</label>
      </div>

      <div>
        <p className="mb-2 text-sm text-gray-700">Themes</p>
        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-auto pr-1">
          {allThemes.map(theme => {
            const checked = selThemes.includes(theme)
            const toggle = () =>
              setSelThemes(checked ? selThemes.filter(t => t !== theme) : [...selThemes, theme])
            return (
              <label key={theme} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={checked} onChange={toggle} disabled={!isHost} />
                <span>{theme}</span>
              </label>
            )
          })}
        </div>
        <p className="mt-2 text-xs text-gray-500">Leave empty to use the default pool.</p>
      </div>

      {isHost ? (
        <button
          onClick={onSave}
          disabled={busy}
          className="w-full bg-slate-800 text-white py-2 px-4 rounded-md hover:bg-slate-900 transition disabled:opacity-60"
        >
          {busy ? 'Saving…' : 'Save Settings'}
        </button>
      ) : (
        <p className="text-xs text-gray-500">Waiting for host to configure settings…</p>
      )}
    </div>
  )
}
