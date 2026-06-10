# NulisIQ - AI Writing Companion for Indonesian Writers

NulisIQ is a Next.js 14 writing companion built for the Microsoft Agents League Hackathon. It helps Indonesian writers request suggestions, revisions, continuations, and consistency checks while keeping manuscript context in the loop.

## Demo Reliability

GitHub Models support is optional because model access can vary by account. If GitHub Models returns `403` or "No access to model", NulisIQ falls back to mock AI so the demo remains usable.

For demo reliability, NulisIQ defaults to:

```env
AI_PROVIDER=mock
WORKIQ_MODE=mock
```

The mock AI fallback returns realistic Indonesian writing guidance and is safe to run without tokens.

## Microsoft IQ Layer

NulisIQ includes a Work IQ-ready contextual memory layer. The current MVP uses mock manuscript memory fallback, then passes that context into the AI prompt together with:

- current editor text
- selected AI mode
- manuscript memory
- Work IQ or mock Work IQ context
- writing style
- themes
- character or concept memory
- previous draft summary

No confidential information should be uploaded to this MVP or to any external AI provider.

## AI Providers

Set `AI_PROVIDER` in `.env.local`:

```env
AI_PROVIDER=mock
```

Supported values:

- `mock` - default, token-free demo mode
- `azure` - Azure OpenAI / Azure AI Foundry-compatible chat completions
- `github` - GitHub Models-compatible chat completions

Azure variables:

```env
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_DEPLOYMENT=
```

GitHub Models variables:

```env
GITHUB_MODELS_TOKEN=
GITHUB_MODEL=
```

## Getting Started

```bash
git clone https://github.com/AhmadHidayatP/writing-companion
cd writing-companion
npm install
cp .env.local.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Tiptap editor
- Optional GitHub Models
- Azure OpenAI / Azure AI Foundry-ready provider path
- Work IQ-ready contextual memory layer

GitHub Copilot was used as an assisted development tool during development.
