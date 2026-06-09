# Writing Companion — AI untuk Penulis Indonesia

> Asisten menulis bertenaga AI yang memahami konteks naskahmu secara utuh.  
> Dibangun untuk **Agents League Hackathon 2026** — track 🎨 Creative Apps + 💡 Best Use of IQ Tools.

---

## Cara pakai

```bash
# 1. Clone & install
git clone https://github.com/YOUR_USERNAME/writing-companion
cd writing-companion
npm install

# 2. Setup environment
cp .env.local.example .env.local
# Isi GITHUB_TOKEN dan WORKIQ_* di .env.local

# 3. Jalankan
npm run dev
# Buka http://localhost:3000
```

## Microsoft IQ Integration

Proyek ini menggunakan **Work IQ** sebagai intelligence layer:
- Upload naskah/chapter ke Work IQ index
- Setiap request ke AI disertai konteks relevan dari naskah
- AI memahami gaya bahasa, karakter, dan tema penulismu

## Stack

- Next.js 14 · TypeScript · Tailwind CSS
- GitHub Copilot API (Creative Apps track)
- Microsoft Work IQ (memory & context retrieval)
- Vercel (deployment)
