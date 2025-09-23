// src/hooks/useGameLogic.ts
'use client'
import React from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Player, Step } from '../lib/gameTypes'
import { DEFAULT_WORDS, WordPair } from '../lib/words'

export function useGameLogic() {
  const [step, setStep] = React.useState<Step>('setup')
  const [numPlayers, setNumPlayers] = React.useState(3)
  const [players, setPlayers] = React.useState<Player[]>([])
  const [currentRevealIndex, setCurrentRevealIndex] = React.useState(0)
  const [startingPlayerIndex, setStartingPlayerIndex] = React.useState(0)
  const [wordPair, setWordPair] = React.useState<WordPair>({ secret: '', hint: '', theme: '' })

  const [localNames, setLocalNames] = React.useState<string[]>(
    Array(8)
      .fill('')
      .map((_, i) => `Player ${i + 1}`)
  )

  // Theme selection state
  const [showThemeSelector, setShowThemeSelector] = React.useState(false)
  const [selectedThemes, setSelectedThemes] = React.useState<string[]>([])

  // Hint toggle states
  const [imposterGetsHint, setImposterGetsHint] = React.useState(false)
  const [themeHintEnabled, setThemeHintEnabled] = React.useState(false)

  // Get all unique themes
  const allThemes = React.useMemo(() => {
    const themes = new Set(DEFAULT_WORDS.map(word => word.theme))
    return Array.from(themes)
  }, [])

  // Toggle theme selection
  const toggleTheme = (theme: string) => {
    setSelectedThemes(prev =>
      prev.includes(theme)
        ? prev.filter(t => t !== theme)
        : [...prev, theme]
    )
  }

  function startGame() {
    // Filter words by selected themes if any are selected
    const filteredWords = selectedThemes.length > 0
      ? DEFAULT_WORDS.filter(word => selectedThemes.includes(word.theme))
      : DEFAULT_WORDS

    if (filteredWords.length === 0) {
      alert("No words available for the selected themes. Please select different themes.")
      return
    }

    const chosen = filteredWords[Math.floor(Math.random() * filteredWords.length)]
    setWordPair(chosen)

    const ids = Array.from({ length: numPlayers }).map((_, i) => ({
      id: uuidv4(),
      name: localNames[i] || `Player ${i + 1}`,
      role: 'player' as const
    }))

    const impIndex = Math.floor(Math.random() * ids.length)
    const updatedPlayers = ids.map((player, index) =>
      index === impIndex ? { ...player, role: 'imposter' as const } : player
    )

    setPlayers(updatedPlayers)
    setStep('reveal')
    setCurrentRevealIndex(0)
  }

  function doneReveal() {
    if (currentRevealIndex + 1 >= players.length) {
      const randomStartIndex = Math.floor(Math.random() * players.length)
      setStartingPlayerIndex(randomStartIndex)
      setStep('play')
    } else {
      setCurrentRevealIndex(currentRevealIndex + 1)
    }
  }

  function resetToSetup() {
    setStep('setup')
    setPlayers([])
    setCurrentRevealIndex(0)
    setStartingPlayerIndex(0)
    setWordPair({ secret: '', hint: '', theme: '' })
    setImposterGetsHint(false)
    setThemeHintEnabled(false)
  }

  return {
    // state
    step,
    setStep,
    numPlayers,
    setNumPlayers,
    players,
    localNames,
    setLocalNames,
    showThemeSelector,
    setShowThemeSelector,
    allThemes,
    selectedThemes,
    wordPair,
    startingPlayerIndex,
    currentRevealIndex,
    imposterGetsHint,
    setImposterGetsHint,
    themeHintEnabled,
    setThemeHintEnabled,

    // actions
    toggleTheme,
    startGame,
    doneReveal,
    resetToSetup
  }
}
