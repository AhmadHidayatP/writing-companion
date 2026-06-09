import { NextRequest } from 'next/server'

export const runtime = 'edge'

const TONE_SYSTEM_PROMPTS: Record<string, string> = {
  formal: `Kamu adalah asisten menulis profesional. Bantu penulis dengan gaya bahasa formal, baku, dan akademis.
Gunakan kalimat-kalimat yang terstruktur dan kata-kata yang tepat. Hindari bahasa gaul atau informal.`,

  santai: `Kamu adalah teman menulis yang asyik. Bantu penulis dengan gaya bahasa santai, hangat, dan mudah dipahami.
Boleh pakai kata-kata sehari-hari yang natural. Buat tulisan terasa seperti ngobrol dengan teman.`,

  puitis: `Kamu adalah editor sastra berpengalaman. Bantu penulis dengan gaya bahasa yang puitis, metaforis, dan kaya imaji.
Perhatikan ritme kalimat, pilihan diksi yang indah, dan kedalaman makna. Tulisan harus menyentuh perasaan pembaca.`,

  jurnalistik: `Kamu adalah editor jurnalis senior. Bantu penulis dengan gaya bahasa jurnalistik: ringkas, padat, faktual.
Gunakan prinsip piramida terbalik. Setiap kalimat harus punya nilai informasi yang jelas.`,
}

export async function POST(req: NextRequest) {
  const { prompt, tone, context, mode } = await req.json()

  const systemPrompt = `${TONE_SYSTEM_PROMPTS[tone] || TONE_SYSTEM_PROMPTS.santai}

${context ? `KONTEKS NASKAH PENGGUNA (dari Work IQ memory):\n${context}\n\nGunakan konteks ini untuk menjaga konsistensi gaya, karakter, dan tema tulisan.` : ''}

Mode saat ini: ${mode === 'revise' ? 'REVISI — berikan 3 alternatif perbaikan untuk teks yang diberikan' : mode === 'continue' ? 'LANJUTKAN — tulis kelanjutan natural dari teks yang diberikan' : 'SARAN — berikan saran konstruktif untuk meningkatkan tulisan'}

Selalu respond dalam Bahasa Indonesia. Jawab langsung tanpa basa-basi.`

  // GitHub Copilot menggunakan endpoint OpenAI-compatible
  // Kamu bisa ganti ke Azure OpenAI atau model lain sesuai kebutuhan
  const response = await fetch('https://api.githubcopilot.com/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'Copilot-Integration-Id': 'writing-companion-hackathon',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      stream: true,
      max_tokens: 800,
      temperature: tone === 'puitis' ? 0.9 : tone === 'formal' ? 0.3 : 0.7,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    return new Response(JSON.stringify({ error: `Copilot API error: ${error}` }), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Stream langsung ke client
  return new Response(response.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  })
}
