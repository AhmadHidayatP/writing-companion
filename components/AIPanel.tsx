'use client'

import { Sparkles, RefreshCw, Copy, Check, AlertCircle } from 'lucide-react'
import { useState } from 'react'

export type AIMode = 'suggest' | 'revise' | 'continue' | 'consistency'

interface Suggestion {
  id: string
  text: string
  mode: AIMode
}

interface Props {
  suggestions: Suggestion[]
  isLoading: boolean
  error: string | null
  activeMode: AIMode
  onModeChange: (mode: AIMode) => void
  onApply: (text: string) => void
  onRetry: () => void
  contextSource: 'mock-foundryiq' | 'foundryiq' | 'azure-search' | 'none'
  aiProviderStatus: string
  iqStatus: string
  iqRetrievalStatus: string
}

const MODES: { value: AIMode; label: string; desc: string }[] = [
  { value: 'suggest',     label: 'Saran',       desc: 'Kritik & saran perbaikan' },
  { value: 'revise',      label: 'Revisi',      desc: '3 versi alternatif' },
  { value: 'continue',    label: 'Lanjutkan',   desc: 'Sambung tulisan' },
  { value: 'consistency', label: 'Konsistensi', desc: 'Cek gaya, tema, dan memori' },
]

export default function AIPanel({
  suggestions, isLoading, error, activeMode,
  onModeChange, onApply, onRetry, contextSource,
  aiProviderStatus, iqStatus, iqRetrievalStatus,
}: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Mode tabs */}
      <div className="flex border-b border-ink-200 bg-white">
        {MODES.map((mode) => (
          <button
            key={mode.value}
            onClick={() => onModeChange(mode.value)}
            title={mode.desc}
            className={`
              flex-1 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px
              ${activeMode === mode.value
                ? 'border-accent-500 text-accent-600'
                : 'border-transparent text-ink-500 hover:text-ink-800'
              }
            `}
          >
            {mode.label}
          </button>
        ))}
      </div>

      <div className="mx-3 mt-3 space-y-1.5">
        <div className="px-3 py-1.5 rounded-lg text-xs bg-green-50 text-green-700 border border-green-200">
          {aiProviderStatus}
        </div>
        <div className="px-3 py-1.5 rounded-lg text-xs bg-blue-50 text-blue-700 border border-blue-200">
          {iqStatus}
        </div>
        <div className={`px-3 py-1.5 rounded-lg text-xs border ${
          contextSource === 'mock-foundryiq'
            ? 'bg-amber-50 text-amber-700 border-amber-200'
            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
        }`}>
          {iqRetrievalStatus}
        </div>
      </div>

      {/* Context badge */}
      {contextSource !== 'none' && (
        <div className={`
          mx-3 mt-2 px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5
          ${contextSource === 'foundryiq' || contextSource === 'azure-search'
            ? 'bg-blue-50 text-blue-700 border border-blue-200'
            : 'bg-ink-100 text-ink-500 border border-ink-200'
          }
        `}>
          <Sparkles size={11} />
          {contextSource === 'foundryiq' || contextSource === 'azure-search'
            ? 'Menggunakan konteks dari Microsoft IQ Knowledge Layer'
            : 'Foundry IQ-style retrieval: demo fallback'
          }
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Loading */}
        {isLoading && (
          <div className="space-y-2 mt-1">
            {[1, 2, 3].slice(0, activeMode === 'revise' ? 3 : 1).map((i) => (
              <div key={i} className="rounded-xl border border-ink-200 p-3 space-y-2">
                <div className="h-3 shimmer rounded-full w-3/4" />
                <div className="h-3 shimmer rounded-full w-full" />
                <div className="h-3 shimmer rounded-full w-5/6" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3">
            <div className="flex items-start gap-2 text-red-700 text-sm">
              <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Gagal menghubungi AI</p>
                <p className="text-red-500 text-xs mt-1">{error}</p>
              </div>
            </div>
            <button
              onClick={onRetry}
              className="mt-2 flex items-center gap-1 text-xs text-red-600 hover:text-red-800 font-medium"
            >
              <RefreshCw size={11} /> Coba lagi
            </button>
          </div>
        )}

        {/* Suggestions */}
        {!isLoading && !error && suggestions.map((s, idx) => (
          <div
            key={s.id}
            className="suggestion-item rounded-xl border border-ink-200 bg-white p-3 group hover:border-ink-300 transition-colors"
          >
            {activeMode === 'revise' && (
              <p className="text-xs font-medium text-ink-400 mb-1.5">
                Versi {idx + 1}
              </p>
            )}
            <p className="text-sm text-ink-700 leading-relaxed whitespace-pre-wrap">
              {s.text}
            </p>
            <div className="flex gap-2 mt-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onApply(s.text)}
                className="flex-1 py-1.5 rounded-lg bg-accent-500 text-white text-xs font-medium hover:bg-accent-600 transition-colors"
              >
                Terapkan
              </button>
              <button
                onClick={() => handleCopy(s.text, s.id)}
                className="px-2.5 py-1.5 rounded-lg border border-ink-200 text-ink-500 hover:text-ink-800 transition-colors"
              >
                {copiedId === s.id
                  ? <Check size={12} className="text-green-600" />
                  : <Copy size={12} />
                }
              </button>
            </div>
          </div>
        ))}

        {/* Empty state */}
        {!isLoading && !error && suggestions.length === 0 && (
          <div className="text-center py-8">
            <Sparkles size={24} className="text-ink-300 mx-auto mb-2" />
            <p className="text-sm text-ink-400">
              Tulis sesuatu, lalu klik <strong className="text-ink-600">Minta AI</strong>
            </p>
            <p className="text-xs text-ink-300 mt-1">
              Pilih mode di atas sesuai kebutuhan
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
