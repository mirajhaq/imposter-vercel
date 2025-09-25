import React from 'react'

type ThemeTileProps = {
  selectedThemes: string[]
  allThemes: string[]
  specialThemes?: string[]  // optional
  onClick: () => void
}

export default function ThemeTile({
  selectedThemes,
  allThemes,
  specialThemes = [],
  onClick
}: ThemeTileProps) {
  // If no themes are selected, show all defaults.
  // If themes are selected, show ONLY the selected ones (default + special).
  const themesToShow =
    selectedThemes.length === 0
      ? allThemes
      : selectedThemes.filter(
          (theme) => allThemes.includes(theme) || specialThemes.includes(theme)
        )

  return (
    <div onClick={onClick}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
        {themesToShow.map((theme) => {
          const isSelected = selectedThemes.includes(theme)
          const isSpecial = specialThemes.includes(theme)

          return (
            <span
              key={theme}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: isSpecial ? '8px' : '9px',
                backgroundColor: isSpecial
                  ? isSelected
                    ? '#c79611ff' // gold when selected
                    : '#c2c2c2ff' // gray when not selected
                  : isSelected
                    ? '#7baf02ff' // green when selected
                    : '#c2c2c2ff', // gray when not selected
                color: isSelected ? 'white' : '#64748b',
                cursor: 'pointer'
              }}
            >
              {theme}
            </span>
          )
        })}
      </div>
    </div>
  )
}
