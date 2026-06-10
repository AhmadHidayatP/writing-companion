import { NextRequest, NextResponse } from 'next/server'

type IQSource = 'mock-foundryiq' | 'foundryiq' | 'azure-search'
type IQStatus = 'fallback' | 'active'

type RetrievedDocument = {
  title: string
  source: string
  chapter: string
  content: string
}

type FoundryIQContext = {
  context: string
  source: IQSource
  status: IQStatus
  retrievedDocuments: RetrievedDocument[]
  memory: {
    writingStyle: string
    themes: string[]
    charactersOrConcepts: string[]
    previousDraftSummary: string
    safetyNote: string
  }
}

const DEFAULT_QUERY = 'writing style themes character previous draft manuscript memory'

export async function POST(req: NextRequest) {
  const { query = DEFAULT_QUERY, topK = 3 } = await req.json()
  const searchQuery = typeof query === 'string' && query.trim() ? query : DEFAULT_QUERY

  const provider = process.env.IQ_PROVIDER || 'mock'
  const endpoint = process.env.AZURE_SEARCH_ENDPOINT
  const apiKey = process.env.AZURE_SEARCH_API_KEY
  const index = process.env.AZURE_SEARCH_INDEX || 'writing-companion-index'
  const apiVersion = process.env.AZURE_SEARCH_API_VERSION || '2025-09-01'

  if (provider !== 'foundry' || !endpoint || !apiKey) {
    return NextResponse.json(getMockFoundryIQContext(searchQuery))
  }

  try {
    const response = await fetch(
      `${endpoint.replace(/\/$/, '')}/indexes/${index}/docs/search?api-version=${apiVersion}`,
      {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          search: searchQuery,
          queryType: 'semantic',
          semanticConfiguration: 'default',
          top: topK,
          select: 'content,source,chapter,title',
          captions: 'extractive',
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`Azure AI Search error: ${response.status}`)
    }

    const data = await response.json()
    const retrievedDocuments = toRetrievedDocuments(data.value)
    const context = retrievedDocuments
      .map((doc) => `[${doc.title} | ${doc.chapter} | ${doc.source}]\n${doc.content}`)
      .join('\n\n')

    const fallbackMemory = getMockFoundryIQContext(searchQuery).memory
    const result: FoundryIQContext = {
      context: context || getMockFoundryIQContext(searchQuery).context,
      source: 'azure-search',
      status: 'active',
      retrievedDocuments,
      memory: fallbackMemory,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Foundry IQ retrieval fallback:', error)
    return NextResponse.json(getMockFoundryIQContext(searchQuery))
  }
}

function toRetrievedDocuments(
  value: Array<{ title?: string; source?: string; chapter?: string; content?: string }> | undefined
): RetrievedDocument[] {
  return (value || [])
    .map((doc, index) => ({
      title: doc.title || `Manuscript Memory ${index + 1}`,
      source: doc.source || 'Azure AI Search index',
      chapter: doc.chapter || 'Naskah',
      content: doc.content || '',
    }))
    .filter((doc) => doc.content.trim())
}

function getMockFoundryIQContext(query: string): FoundryIQContext {
  const lowerQuery = query.toLowerCase()
  const documents: RetrievedDocument[] = [
    {
      title: 'Pikiran yang Terus Membawa',
      source: 'dummy-manuscript-memory',
      chapter: 'Bab 1',
      content:
        'Narator orang pertama mulai sadar bahwa rasa lelahnya bukan hanya karena pekerjaan, tetapi karena kebiasaan membuktikan diri terus-menerus. Ia berbicara dengan nada reflektif, hangat, dan dekat dengan anak muda Indonesia yang sering merasa harus selalu produktif.',
    },
    {
      title: 'Validasi yang Tidak Pernah Selesai',
      source: 'dummy-manuscript-memory',
      chapter: 'Bab 2',
      content:
        'Tema utama bab ini adalah self-worth dan validasi. Narator belajar bahwa nilai dirinya tidak harus ditentukan oleh balasan chat, pujian atasan, angka performa, atau penerimaan orang lain.',
    },
    {
      title: 'Ruang Kecil untuk Pulang',
      source: 'dummy-style-memory',
      chapter: 'Catatan Gaya',
      content:
        'Gaya penulis memakai Bahasa Indonesia sederhana, personal, dan tidak menggurui. Metafora yang sering muncul: ruang di kepala, beban yang digendong, napas yang akhirnya diberi tempat, dan pulang kepada diri sendiri.',
    },
  ]

  if (lowerQuery.includes('karakter') || lowerQuery.includes('tokoh')) {
    documents.unshift({
      title: 'Narator Aku',
      source: 'dummy-character-memory',
      chapter: 'Character Memory',
      content:
        'Narator adalah anak muda Indonesia, kreatif, mudah overthinking, sering takut tidak cukup baik, tetapi mulai belajar menamai kebutuhan dirinya tanpa meminta izin dari validasi luar.',
    })
  }

  if (lowerQuery.includes('burnout') || lowerQuery.includes('lelah')) {
    documents.unshift({
      title: 'Burnout yang Diam-Diam',
      source: 'dummy-theme-memory',
      chapter: 'Theme Memory',
      content:
        'Burnout digambarkan bukan sebagai ledakan besar, melainkan lelah pelan-pelan: bangun tanpa rasa pulih, tetap menjawab pesan, tetap terlihat baik-baik saja, padahal batin meminta jeda.',
    })
  }

  return {
    context: documents
      .map((doc) => `[${doc.title} | ${doc.chapter} | ${doc.source}]\n${doc.content}`)
      .join('\n\n'),
    source: 'mock-foundryiq',
    status: 'fallback',
    retrievedDocuments: documents,
    memory: {
      writingStyle:
        'Bahasa Indonesia reflektif, personal, hangat, sederhana, dan tidak menggurui; terasa seperti catatan jujur untuk pembaca muda.',
      themes: ['burnout', 'self-worth', 'validasi diri', 'overthinking', 'proses pulih'],
      charactersOrConcepts: [
        'narator orang pertama',
        'anak muda Indonesia',
        'kebutuhan validasi',
        'belajar pulang kepada diri sendiri',
      ],
      previousDraftSummary:
        'Draft sebelumnya mengikuti narator yang mulai menyadari bahwa ia terlalu lama mengukur diri dari produktivitas, penerimaan orang lain, dan rasa takut tidak cukup baik.',
      safetyNote:
        'Demo menggunakan dummy manuscript memory. Jangan unggah informasi rahasia, data pribadi sensitif, atau naskah yang belum boleh dibagikan.',
    },
  }
}
