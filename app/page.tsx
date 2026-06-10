'use client'

import { useState, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import ToneSelector, { type Tone } from '@/components/ToneSelector'
import AIPanel, { type AIMode } from '@/components/AIPanel'
import { Sparkles, BookOpen, Wand2 } from 'lucide-react'

// Dynamic import untuk Editor (Tiptap tidak SSR-safe)
const Editor = dynamic(() => import('@/components/Editor'), { ssr: false })

interface Suggestion {
  id: string
  text: string
  mode: AIMode
}

export default function Home() {
  const [text, setText]                         = useState('')
  const [tone, setTone]                         = useState<Tone>('santai')
  const [aiMode, setAiMode]                     = useState<AIMode>('suggest')
  const [suggestions, setSuggestions]           = useState<Suggestion[]>([])
  const [isLoading, setIsLoading]               = useState(false)
  const [error, setError]                       = useState<string | null>(null)
  const [contextSource, setContextSource]       = useState<'workiq' | 'mock' | 'none'>('none')
  const [appliedText, setAppliedText]           = useState('')
  const [aiProviderStatus, setAiProviderStatus] = useState('AI Provider: Mock Demo Mode')
  const [iqStatus, setIqStatus]                 = useState('Microsoft IQ Layer: Work IQ-ready fallback')

  const lastRequestRef = useRef<AbortController | null>(null)

  const fetchWorkIQContext = useCallback(async (query: string) => {
    try {
      const res = await fetch('/api/workiq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })
      const data = await res.json()
      setContextSource(data.source as 'workiq' | 'mock')
      return data.context as string
    } catch {
      return ''
    }
  }, [])

  const fetchAISuggestion = useCallback(async () => {
    if (!text.trim()) return

    // Batalkan request sebelumnya jika ada
    lastRequestRef.current?.abort()
    const controller = new AbortController()
    lastRequestRef.current = controller

    setIsLoading(true)
    setError(null)
    setSuggestions([])

    try {
      // 1. Ambil konteks dari Work IQ
      const context = await fetchWorkIQContext(text.slice(0, 200))

      // 2. Buat prompt sesuai mode
      const prompts: Record<AIMode, string> = {
        suggest:     `Berikan saran konkret untuk meningkatkan tulisan berikut:\n\n${text}`,
        revise:      `Berikan 3 versi alternatif yang lebih baik dari paragraf berikut. Format: berikan setiap versi dipisah dengan "---":\n\n${text}`,
        continue:    `Lanjutkan tulisan berikut secara natural, 2-3 kalimat:\n\n${text}`,
        consistency: `Periksa konsistensi gaya, tema, karakter, konsep, dan alur dari tulisan berikut:\n\n${text}`,
      }

      // 3. Panggil Copilot API dengan streaming
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          prompt: prompts[aiMode],
          tone,
          context,
          workIqContext: context,
          mode: aiMode,
          editorText: text,
          manuscriptMemory: 'Mock manuscript memory fallback aktif untuk MVP demo. Naskah berfokus pada refleksi personal, proses memahami diri, dan perubahan kecil yang terasa jujur.',
          writingStyle: tone,
          themes: ['pertumbuhan diri', 'refleksi', 'keberanian memulai ulang'],
          characterMemory: 'Narator orang pertama yang sensitif, kreatif, dan sedang belajar mengurangi overthinking tanpa menghakimi diri sendiri.',
          previousDraftSummary: text.slice(0, 280),
        }),
      })

      if (!res.ok) throw new Error(`API error ${res.status}`)

      setAiProviderStatus(res.headers.get('X-AI-Provider-Status') || 'AI Provider: Mock Demo Mode')
      setIqStatus(res.headers.get('X-IQ-Status') || 'Microsoft IQ Layer: Work IQ-ready fallback')

      // 4. Parse streaming response
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '))

        for (const line of lines) {
          const data = line.slice(6)
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            const delta = parsed.choices?.[0]?.delta?.content || ''
            fullText += delta
          } catch { /* skip malformed chunks */ }
        }
      }

      // 5. Split jika mode revisi (3 versi dipisah ---)
      const parts = aiMode === 'revise'
        ? fullText.split(/---+/).map(p => p.trim()).filter(Boolean).slice(0, 3)
        : [fullText.trim()]

      setSuggestions(
        parts.map((text, i) => ({
          id: `${Date.now()}-${i}`,
          text,
          mode: aiMode,
        }))
      )
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setIsLoading(false)
    }
  }, [text, tone, aiMode, fetchWorkIQContext])

  const handleApply = useCallback((suggestion: string) => {
    if (aiMode === 'revise' || aiMode === 'continue') {
      setAppliedText(aiMode === 'revise' ? suggestion : text + '\n\n' + suggestion)
    }
    setSuggestions([])
  }, [aiMode, text])

  return (
    <div className="h-screen flex flex-col bg-ink-50">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 bg-white border-b border-ink-200 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent-500 flex items-center justify-center">
            <BookOpen size={14} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-ink-900 leading-none">
              Writing Companion
            </h1>
            <p className="text-xs text-ink-400 leading-none mt-0.5">
              Agents League Hackathon 2026
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ToneSelector value={tone} onChange={setTone} />
          <button
            onClick={fetchAISuggestion}
            disabled={isLoading || !text.trim()}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
              transition-all duration-150
              ${isLoading || !text.trim()
                ? 'bg-ink-200 text-ink-400 cursor-not-allowed'
                : 'bg-accent-500 text-white hover:bg-accent-600 active:scale-95 shadow-sm'
              }
            `}
          >
            {isLoading
              ? <><Wand2 size={14} className="animate-spin" /> Memproses…</>
              : <><Sparkles size={14} /> Minta AI</>
            }
          </button>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor — 65% */}
        <main className="flex-1 overflow-hidden border-r border-ink-200">
          <Editor
            content={appliedText}
            onChange={setText}
            placeholder="Mulai menulis di sini… atau tempel teks yang ingin direvisi."
          />
        </main>

        {/* AI Panel — 35% */}
        <aside className="w-80 xl:w-96 flex-shrink-0 bg-ink-50 overflow-hidden flex flex-col">
          <AIPanel
            suggestions={suggestions}
            isLoading={isLoading}
            error={error}
            activeMode={aiMode}
            onModeChange={setAiMode}
            onApply={handleApply}
            onRetry={fetchAISuggestion}
            contextSource={contextSource}
            aiProviderStatus={aiProviderStatus}
            iqStatus={iqStatus}
          />
        </aside>
      </div>
    </div>
  )
}
