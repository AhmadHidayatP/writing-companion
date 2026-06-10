import { NextRequest, NextResponse } from 'next/server'

// Work IQ: Microsoft's intelligence layer untuk memory kontekstual
// Docs: https://aka.ms/agentsleague
export async function POST(req: NextRequest) {
  const { query, topK = 3 } = await req.json()

  const mode     = process.env.WORKIQ_MODE || 'mock'
  const endpoint = process.env.WORKIQ_ENDPOINT
  const apiKey   = process.env.WORKIQ_API_KEY
  const index    = process.env.WORKIQ_INDEX_NAME || 'writing-companion-index'

  // Jika Work IQ belum dikonfigurasi, return mock context untuk development
  if (mode === 'mock' || !endpoint || !apiKey) {
    return NextResponse.json({
      context: getMockContext(query),
      source: 'mock',
    })
  }

  try {
    const response = await fetch(`${endpoint}/indexes/${index}/docs/search`, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        search: query,
        queryType: 'semantic',
        semanticConfiguration: 'default',
        top: topK,
        select: 'content,source,chapter',
        captions: 'extractive',
      }),
    })

    if (!response.ok) {
      throw new Error(`Work IQ error: ${response.statusText}`)
    }

    const data = await response.json()

    // Gabungkan hasil retrieval menjadi konteks
    const context = data.value
      ?.map((doc: { content: string; source?: string; chapter?: string }) =>
        `[${doc.source || doc.chapter || 'Naskah'}]: ${doc.content}`
      )
      .join('\n\n') || ''

    return NextResponse.json({ context, source: 'workiq' })
  } catch (error) {
    console.error('Work IQ error:', error)
    // Graceful fallback — jangan crash app
    return NextResponse.json({ context: getMockContext(query), source: 'mock' })
  }
}

// Mock context untuk development sebelum Work IQ dikonfigurasi
function getMockContext(query: string): string {
  const samples: Record<string, string> = {
    default: `[Chapter 1 — "Pikiran yang Terus Membawa"]: 
Tulisan ini menggunakan gaya reflektif dan personal. Suara narator adalah orang pertama (aku) yang 
sedang dalam proses menyadari pola pikir lamanya. Tone: hangat, jujur, tidak menghakimi diri sendiri.
Metafora yang sudah dipakai: "beban yang digendong", "ruang yang sempit di kepala".`,
  }
  
  if (query.toLowerCase().includes('karakter') || query.toLowerCase().includes('tokoh')) {
    return `[Karakter Utama]: Narator adalah sosok yang sedang dalam perjalanan self-discovery. 
Usia 20-an akhir, tinggal sendiri, bekerja kreatif. Struggle utama: overthinking dan rasa takut tidak cukup baik.`
  }
  
  return samples.default
}
