'use client'

export type Tone = 'formal' | 'santai' | 'puitis' | 'jurnalistik'

const TONES: { value: Tone; label: string; desc: string; emoji: string }[] = [
  { value: 'santai',      label: 'Santai',      desc: 'Hangat & conversational', emoji: '☕' },
  { value: 'puitis',      label: 'Puitis',      desc: 'Sastrawi & metaforis',    emoji: '🌙' },
  { value: 'formal',      label: 'Formal',      desc: 'Baku & akademis',         emoji: '📖' },
  { value: 'jurnalistik', label: 'Jurnalistik', desc: 'Padat & faktual',         emoji: '📰' },
]

interface Props {
  value: Tone
  onChange: (tone: Tone) => void
}

export default function ToneSelector({ value, onChange }: Props) {
  return (
    <div className="flex gap-2 flex-wrap">
      {TONES.map((tone) => (
        <button
          key={tone.value}
          onClick={() => onChange(tone.value)}
          title={tone.desc}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
            transition-all duration-150 border
            ${value === tone.value
              ? 'bg-accent-500 text-white border-accent-500 shadow-sm'
              : 'bg-white text-ink-600 border-ink-200 hover:border-ink-400 hover:text-ink-900'
            }
          `}
        >
          <span className="text-base leading-none">{tone.emoji}</span>
          {tone.label}
        </button>
      ))}
    </div>
  )
}
