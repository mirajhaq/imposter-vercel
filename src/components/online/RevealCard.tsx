'use client'
import React from 'react'

type Props = {
  isMyTurn: boolean
  waitingForName: string
  content: string | null
  themeLabel: string | null
  showTheme: boolean
  revealed: boolean
  busy: boolean
  onReveal: () => void
  onDone: () => void
}

export default function RevealCard({
  isMyTurn,
  waitingForName,
  content,
  themeLabel,
  showTheme,
  revealed,
  busy,
  onReveal,
  onDone,
}: Props) {
  return (
    <div className="p-4 border rounded-md bg-gray-50 space-y-3">
      <p className="font-semibold text-center">
        {isMyTurn ? 'It’s your turn to reveal' : `Waiting for ${waitingForName} to reveal…`}
      </p>

      {isMyTurn && (
        <>
          {!content ? (
            <button
              onClick={onReveal}
              disabled={busy}
              className="w-full bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 transition disabled:opacity-60"
            >
              {busy ? 'Revealing…' : (revealed ? 'Show my word again' : 'Reveal my word')}
            </button>
          ) : (
            <>
              <div className="mt-3">
                <p className="font-semibold mb-1">Your word / hint:</p>
                <p className="text-xl break-words">{content}</p>
                {showTheme && themeLabel ? (
                  <p className="text-sm text-gray-500 mt-2">Theme: {themeLabel}</p>
                ) : null}
              </div>

              <button
                onClick={onDone}
                disabled={busy}
                className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition disabled:opacity-60"
              >
                {busy ? 'Continuing…' : 'I’m done'}
              </button>
            </>
          )}
        </>
      )}
    </div>
  )
}
