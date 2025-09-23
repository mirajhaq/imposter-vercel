// src/components/PlayerReveal.tsx
'use client'
import React from 'react'

type Props = {
  name: string
  isImposter: boolean
  secret?: string
  hint?: string
  theme?: string
  themeHintEnabled?: boolean
  onDone: () => void
  isLastPlayer: boolean
}

export default function PlayerReveal({
  name,
  isImposter,
  secret,
  hint,
  theme,
  themeHintEnabled = false,
  onDone,
  isLastPlayer,
}: Props) {
  const [shown, setShown] = React.useState(false)

  return (
    <div className="screen-center">
      <div className="card text-center">
        <h2 className="step-title">Reveal for {name}</h2>

        {!shown ? (
          <button
            onClick={() => setShown(true)}
            className="btn btn-primary"
          >
            Reveal
          </button>
        ) : (
          <div>
            <div className="info-card my-6">
              {isImposter ? (
                <>
                  <p className="info-text info-imposter">Imposter — you see a hint</p>
                  <p className="info-highlight info-imposter">{hint}</p>
                  {themeHintEnabled && (
                    <>
                      <p className="info-text info-imposter mt-2">Theme:</p>
                      <p className="info-highlight info-imposter">{theme}</p>
                    </>
                  )}
                </>
              ) : (
                <>
                  <p className="info-text">Player — you see the secret word</p>
                  <p className="info-highlight">{secret}</p>
                </>
              )}
            </div>

            <button
              onClick={onDone}
              className="btn btn-primary mt-4"
            >
              {isLastPlayer ? 'Start Game' : 'Done — Pass phone'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
