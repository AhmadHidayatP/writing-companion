import { NextRequest } from 'next/server'

export const runtime = 'edge'

type AIProvider = 'mock' | 'azure' | 'github'
type AIMode = 'suggest' | 'revise' | 'continue' | 'consistency'

interface CopilotRequest {
  prompt?: string
  tone?: string
  context?: string
  mode?: AIMode
  editorText?: string
  foundryIqContext?: string
  workIqContext?: string
  retrievedDocuments?: Array<{
    title: string
    source: string
    chapter: string
    content: string
  }>
  writingStyle?: string
  themes?: string[]
  characterMemory?: string
  previousDraftSummary?: string
  safetyNote?: string
}

const TONE_SYSTEM_PROMPTS: Record<string, string> = {
  formal: `Kamu adalah asisten menulis profesional. Bantu penulis dengan gaya bahasa formal, baku, dan akademis.
Gunakan kalimat yang terstruktur, diksi tepat, dan argumen yang rapi.`,

  santai: `Kamu adalah teman menulis yang hangat. Bantu penulis dengan gaya bahasa santai, natural, dan mudah dipahami.
Tulisan boleh terasa seperti ngobrol, tetapi tetap jernih dan berguna.`,

  puitis: `Kamu adalah editor sastra berpengalaman. Bantu penulis dengan gaya bahasa puitis, metaforis, dan kaya imaji.
Perhatikan ritme kalimat, pilihan diksi, dan kedalaman emosi.`,

  jurnalistik: `Kamu adalah editor jurnalis senior. Bantu penulis dengan gaya jurnalistik: ringkas, padat, faktual.
Setiap kalimat harus punya nilai informasi yang jelas.`,
}

const PROVIDER_LABELS: Record<AIProvider, string> = {
  mock: 'AI Provider: Mock Demo Mode',
  azure: 'AI Provider: Azure OpenAI',
  github: 'AI Provider: GitHub Models',
}

export async function POST(req: NextRequest) {
  const body = await req.json() as CopilotRequest
  const enrichedBody = await enrichWithFoundryIQ(req, body)
  const provider = getProvider()
  const prompt = buildPrompt(enrichedBody)

  if (provider === 'azure') {
    return callAzure(prompt, enrichedBody)
  }

  if (provider === 'github') {
    return callGitHubModels(prompt, enrichedBody)
  }

  return mockResponse(enrichedBody)
}

function getProvider(): AIProvider {
  const value = process.env.AI_PROVIDER?.toLowerCase()
  return value === 'azure' || value === 'github' ? value : 'mock'
}

async function enrichWithFoundryIQ(req: NextRequest, body: CopilotRequest): Promise<CopilotRequest> {
  if (body.foundryIqContext && body.retrievedDocuments && body.writingStyle && body.safetyNote) {
    return body
  }

  try {
    const query = body.editorText || extractEditorText(body.prompt) || 'writing style themes character previous draft manuscript memory'
    const response = await fetch(`${req.nextUrl.origin}/api/foundryiq`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, topK: 3 }),
    })

    if (!response.ok) {
      return withMockFoundryIQ(body)
    }

    const data = await response.json()
    return {
      ...body,
      foundryIqContext: body.foundryIqContext || data.context,
      retrievedDocuments: body.retrievedDocuments || data.retrievedDocuments,
      writingStyle: body.writingStyle || data.memory?.writingStyle,
      themes: body.themes || data.memory?.themes,
      characterMemory: body.characterMemory || data.memory?.charactersOrConcepts?.join(', '),
      previousDraftSummary: body.previousDraftSummary || data.memory?.previousDraftSummary,
      safetyNote: body.safetyNote || data.memory?.safetyNote,
    }
  } catch {
    return withMockFoundryIQ(body)
  }
}

function withMockFoundryIQ(body: CopilotRequest): CopilotRequest {
  return {
    ...body,
    foundryIqContext: body.foundryIqContext || getMockFoundryIqContext(),
    retrievedDocuments: body.retrievedDocuments || [
      {
        title: 'Pikiran yang Terus Membawa',
        source: 'dummy-manuscript-memory',
        chapter: 'Bab 1',
        content: 'Narator orang pertama sedang membahas burnout, overthinking, self-worth, dan kebutuhan validasi dengan nada reflektif Indonesia.',
      },
    ],
    writingStyle:
      body.writingStyle ||
      'Bahasa Indonesia reflektif, personal, hangat, sederhana, dan tidak menggurui.',
    themes: body.themes || ['burnout', 'self-worth', 'validasi diri', 'overthinking'],
    characterMemory:
      body.characterMemory ||
      'Narator orang pertama, anak muda Indonesia, kreatif, sering overthinking, dan belajar pulang kepada diri sendiri.',
    previousDraftSummary:
      body.previousDraftSummary ||
      'Draft sebelumnya membahas proses memahami diri setelah terlalu lama mengejar validasi eksternal.',
    safetyNote:
      body.safetyNote ||
      'Demo menggunakan dummy manuscript memory. Jangan unggah informasi rahasia.',
  }
}

function buildPrompt(body: CopilotRequest): string {
  const mode = body.mode || 'suggest'
  const tone = body.tone || 'santai'
  const editorText = body.editorText || extractEditorText(body.prompt) || '(Belum ada teks editor.)'
  const foundryIqContext = body.foundryIqContext || body.context || body.workIqContext || getMockFoundryIqContext()
  const retrievedDocuments = formatRetrievedDocuments(body.retrievedDocuments)
  const writingStyle = body.writingStyle || tone
  const themes = body.themes?.length ? body.themes.join(', ') : 'burnout, self-worth, validasi diri, overthinking'
  const characterMemory = body.characterMemory || getMockCharacterMemory()
  const previousDraftSummary = body.previousDraftSummary || getMockPreviousDraftSummary(editorText)
  const safetyNote = body.safetyNote || 'Gunakan dummy manuscript memory untuk demo. Jangan unggah informasi rahasia.'

  return `${TONE_SYSTEM_PROMPTS[tone] || TONE_SYSTEM_PROMPTS.santai}

Tugasmu adalah membantu penulis Indonesia sebagai writing companion yang praktis, jujur, dan menjaga konsistensi naskah.

MODE TERPILIH:
${describeMode(mode)}

TEKS EDITOR SAAT INI:
${editorText}

PERINTAH PENGGUNA:
${body.prompt || '(Tidak ada perintah tambahan.)'}

KONTEKS FOUNDRY IQ-STYLE MANUSCRIPT KNOWLEDGE RETRIEVAL:
${foundryIqContext}

DOKUMEN TERAMBIL DARI KNOWLEDGE INDEX:
${retrievedDocuments}

GAYA PENULISAN:
${writingStyle}

TEMA:
${themes}

MEMORI KARAKTER / KONSEP:
${characterMemory}

RINGKASAN DRAFT SEBELUMNYA:
${previousDraftSummary}

CATATAN KEAMANAN:
${safetyNote}

Selalu jawab dalam Bahasa Indonesia.
Jika mode consistency, gunakan struktur:
- Yang sudah konsisten:
- Yang kurang konsisten:
- Saran perbaikan:
- Versi revisi singkat:`
}

async function callAzure(prompt: string, body: CopilotRequest) {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT
  const apiKey = process.env.AZURE_OPENAI_API_KEY
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT

  if (!endpoint || !apiKey || !deployment) {
    return mockResponse(body, 'Azure OpenAI belum dikonfigurasi lengkap. Menggunakan mock AI fallback untuk menjaga demo tetap berjalan.')
  }

  try {
    const url = `${endpoint.replace(/\/$/, '')}/openai/deployments/${deployment}/chat/completions?api-version=2024-06-01`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: body.editorText || body.prompt || '' },
        ],
        stream: true,
        max_tokens: 900,
        temperature: getTemperature(body.tone),
      }),
    })

    if (!response.ok) {
      return mockResponse(body, `Azure OpenAI belum dapat diakses (${response.status}). Menggunakan mock AI fallback untuk demo reliability.`)
    }

    return streamProviderResponse(response, 'azure')
  } catch {
    return mockResponse(body, 'Azure OpenAI sedang tidak dapat dihubungi. Menggunakan mock AI fallback untuk menjaga demo tetap stabil.')
  }
}

async function callGitHubModels(prompt: string, body: CopilotRequest) {
  const token = process.env.GITHUB_MODELS_TOKEN
  const model = process.env.GITHUB_MODEL || 'openai/gpt-4o-mini'

  if (!token) {
    return mockResponse(body, 'GitHub Models token belum diisi. Menggunakan mock AI fallback untuk demo reliability.')
  }

  try {
    const response = await fetch('https://models.github.ai/inference/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: body.editorText || body.prompt || '' },
        ],
        stream: true,
        max_tokens: 900,
        temperature: getTemperature(body.tone),
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      const noAccess = response.status === 403 || /no access to model/i.test(errorText)
      const message = noAccess
        ? 'GitHub Models access is not available for this account. Using mock AI fallback for demo reliability.'
        : `GitHub Models belum dapat diakses (${response.status}). Menggunakan mock AI fallback untuk demo reliability.`

      return mockResponse(body, message)
    }

    return streamProviderResponse(response, 'github')
  } catch {
    return mockResponse(body, 'GitHub Models sedang tidak dapat dihubungi. Menggunakan mock AI fallback untuk demo reliability.')
  }
}

function streamProviderResponse(response: Response, provider: AIProvider) {
  return new Response(response.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-AI-Provider': provider,
      'X-AI-Provider-Status': PROVIDER_LABELS[provider],
      'X-IQ-Status': 'Microsoft IQ Layer: Foundry IQ',
    },
  })
}

function mockResponse(body: CopilotRequest, notice?: string) {
  const text = getMockText(body, notice)
  return new Response(toSse(text), {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-AI-Provider': 'mock',
      'X-AI-Provider-Status': PROVIDER_LABELS.mock,
      'X-IQ-Status': 'Microsoft IQ Layer: Foundry IQ',
    },
  })
}

function toSse(text: string): string {
  const chunks = text.match(/[\s\S]{1,120}/g) || ['']
  const lines = chunks.map((chunk) => {
    const payload = { choices: [{ delta: { content: chunk } }] }
    return `data: ${JSON.stringify(payload)}`
  })

  return `${lines.join('\n\n')}\n\ndata: [DONE]\n\n`
}

function getMockText(body: CopilotRequest, notice?: string): string {
  const mode = body.mode || 'suggest'
  const text = (body.editorText || extractEditorText(body.prompt) || '').trim()
  const opening = notice ? `${notice}\n\n` : ''
  const subject = summarizeText(text)
  const style = body.tone || 'santai'

  if (mode === 'revise') {
    return `${opening}Versi 1
${buildRevision(text, style, 'lebih jernih dan emosional')}

---

Versi 2
${buildRevision(text, style, 'lebih ringkas dan bertenaga')}

---

Versi 3
${buildRevision(text, style, 'lebih reflektif dan mengalir')}`
  }

  if (mode === 'continue') {
    return `${opening}${buildContinuation(text)}`
  }

  if (mode === 'consistency') {
    return `${opening}Yang sudah konsisten:
- Suara narator terasa personal dan reflektif.
- Tema utama tentang proses memahami diri masih terbaca jelas.
- Nuansa kalimat cenderung hangat, sehingga cocok untuk pembaca yang mencari tulisan yang menenangkan.

Yang kurang konsisten:
- Beberapa bagian masih berpindah antara nada analitis dan nada intim tanpa transisi yang halus.
- Jika ada tokoh atau konsep penting, namanya perlu disebut dengan pola yang sama agar pembaca tidak merasa sedang membaca catatan yang terpisah.
- Motivasi emosional di balik paragraf ini masih bisa dibuat lebih spesifik.

Saran perbaikan:
- Tambahkan satu kalimat penghubung yang menjelaskan mengapa momen ini penting bagi narator.
- Pilih satu metafora utama, lalu pakai kembali secara halus agar naskah terasa punya benang merah.
- Pertahankan gaya ${style}, tetapi kurangi kalimat yang terlalu umum.

Versi revisi singkat:
${buildRevision(text, style, 'lebih konsisten dengan memori naskah dan tema utama')}`
  }

  return `${opening}Saran untuk naskah ini:
- Bagian tentang ${subject} sudah punya arah emosional yang jelas. Pertahankan sudut pandang personal karena itu membuat pembaca merasa dekat.
- Tambahkan detail konkret: tempat, gestur kecil, atau satu ingatan singkat. Detail seperti ini akan membuat ide terasa hidup, bukan hanya abstrak.
- Jika ingin gaya ${style} tetap kuat, gunakan variasi panjang kalimat. Satu kalimat pendek setelah kalimat reflektif panjang bisa memberi tekanan yang bagus.
- Pastikan setiap paragraf menjawab satu fungsi: mengungkap perasaan, menggerakkan adegan, atau memperjelas gagasan.

Contoh arah perbaikan:
${buildRevision(text, style, 'lebih hidup dan terarah')}`
}

function describeMode(mode: AIMode): string {
  if (mode === 'revise') return 'REVISI - berikan 3 alternatif perbaikan yang bisa langsung dipakai.'
  if (mode === 'continue') return 'LANJUTKAN - tulis kelanjutan natural 2-3 kalimat.'
  if (mode === 'consistency') return 'KONSISTENSI - audit konsistensi gaya, tema, karakter, konsep, dan alur.'
  return 'SARAN - berikan saran konstruktif dan contoh perbaikan.'
}

function extractEditorText(prompt?: string): string {
  if (!prompt) return ''
  const parts = prompt.split('\n\n')
  return parts[parts.length - 1] || prompt
}

function summarizeText(text: string): string {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (!cleaned) return 'arah tulisan yang sedang dibangun'
  return cleaned.length > 70 ? `${cleaned.slice(0, 70)}...` : cleaned
}

function formatRetrievedDocuments(documents?: CopilotRequest['retrievedDocuments']): string {
  if (!documents?.length) {
    return '- Pikiran yang Terus Membawa | Bab 1 | dummy-manuscript-memory: Narator orang pertama membahas burnout, validasi diri, dan overthinking dengan gaya reflektif.'
  }

  return documents
    .map((doc) => {
      return `- ${doc.title} | ${doc.chapter} | ${doc.source}: ${doc.content}`
    })
    .join('\n')
}

function buildRevision(text: string, tone: string, goal: string): string {
  const fallback = 'Aku berhenti sejenak, mencoba mendengar ulang isi kepala sendiri. Ada bagian dari diriku yang masih ingin berlari, tetapi ada juga bagian lain yang mulai belajar untuk tinggal, menarik napas, dan menamai rasa takut itu pelan-pelan.'
  const base = text.trim() || fallback

  if (tone === 'formal' || tone === 'jurnalistik') {
    return `Paragraf ini dapat dibuat ${goal} dengan memperjelas sebab dan akibatnya: ${base} Dengan begitu, pembaca tidak hanya memahami peristiwa yang terjadi, tetapi juga melihat perubahan sikap narator secara lebih runtut.`
  }

  if (tone === 'puitis') {
    return `${base} Aku membiarkan jeda itu tinggal sedikit lebih lama, seperti cahaya tipis di sela pintu. Dari sana, pelan-pelan, aku belajar bahwa tidak semua gelisah harus segera dikalahkan; sebagian hanya perlu didengarkan sampai ia kehabisan suara.`
  }

  return `${base} Agar terasa ${goal}, kamu bisa menambahkan satu momen kecil yang lebih konkret: napas yang tertahan, layar ponsel yang dibiarkan gelap, atau kalimat yang tidak jadi dikirim. Detail seperti itu membuat emosi narator terasa lebih dekat.`
}

function buildContinuation(text: string): string {
  if (!text.trim()) {
    return 'Aku menatap halaman kosong itu lebih lama dari biasanya. Bukan karena tidak ada yang ingin kutulis, tetapi karena untuk pertama kalinya aku ingin jujur tanpa buru-buru membela diri. Maka aku mulai dari hal paling sederhana: apa yang sebenarnya sedang kurasakan?'
  }

  return 'Aku tidak langsung menemukan jawabannya. Namun kali ini, aku tidak memaksa diri untuk segera rapi. Aku membiarkan pikiran-pikiran itu duduk sebentar, lalu menuliskannya satu per satu, seolah setiap kalimat adalah cara kecil untuk pulang kepada diri sendiri.'
}

function getTemperature(tone?: string): number {
  if (tone === 'puitis') return 0.9
  if (tone === 'formal' || tone === 'jurnalistik') return 0.35
  return 0.7
}

function getMockFoundryIqContext(): string {
  return '[Foundry IQ-style mock retrieval]: Naskah memiliki suara reflektif orang pertama, hangat, dan fokus pada burnout, self-worth, validasi diri, overthinking, serta proses pulih. Metafora yang sering muncul: ruang di kepala, beban yang digendong, napas yang diberi tempat, dan pulang kepada diri sendiri.'
}

function getMockCharacterMemory(): string {
  return 'Narator: orang pertama, kreatif, sensitif terhadap detail, sering meragukan diri tetapi mulai belajar memberi ruang pada proses. Konsep utama: menulis sebagai cara merapikan pikiran.'
}

function getMockPreviousDraftSummary(editorText: string): string {
  if (!editorText.trim()) {
    return 'Draft sebelumnya belum tersedia; gunakan konteks mock untuk menjaga kesinambungan demo.'
  }

  return `Draft sebelumnya berpusat pada: ${summarizeText(editorText)}`
}
