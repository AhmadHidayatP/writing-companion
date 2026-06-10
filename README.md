# NulisIQ - Memory-Aware Writing Companion for Indonesian Creators

NulisIQ is a Next.js 14 writing companion built for the Microsoft Agents League Hackathon. It helps Indonesian creators generate suggestions, revisions, continuations, and consistency checks while grounding AI output in manuscript memory.

NulisIQ integrates a Microsoft IQ knowledge layer through Foundry IQ-style retrieval. The writing agent retrieves manuscript memory from a knowledge index, then uses that context to generate grounded writing suggestions, revisions, continuations, and consistency checks.

This is not a full Work IQ integration. Real Work IQ depends on Microsoft 365 Copilot/admin access. The MVP positions the Microsoft IQ layer as Foundry IQ-style manuscript knowledge retrieval backed by Azure AI Search, with a mock fallback for demo reliability.

## Architecture

Editor
-> Foundry IQ-style manuscript retrieval
-> AI prompt grounding
-> AI generation
-> writing output with memory consistency

The AI model remains the generator. Foundry IQ-style retrieval provides manuscript context, retrieved documents, writing style memory, theme memory, character/concept memory, previous draft summary, and a safety note.

## Demo Scenario

- Load manuscript memory.
- Write a rough paragraph.
- Generate a continuation.
- Rewrite in the writer's style.
- Run a consistency check.
- Show retrieved manuscript context.

## Providers

AI generation can use GitHub Models or another configured provider through the `/api/copilot` route. GitHub Models access can vary by account, so NulisIQ keeps a mock AI fallback and does not crash when a token or model is unavailable.

Foundry IQ-style retrieval can run in two modes:

- `IQ_PROVIDER=mock` uses dummy Indonesian self-development manuscript memory.
- `IQ_PROVIDER=foundry` retrieves manuscript documents from Azure AI Search.

The demo uses dummy manuscript data about reflective Indonesian writing, burnout, self-worth, validation, overthinking, and a first-person narrator for a young Indonesian audience.

No confidential information should be uploaded to this MVP or to any external AI provider.

## Environment

Copy the example file:

```bash
cp .env.local.example .env.local
```

Example values:

```env
AI_PROVIDER=github
GITHUB_MODELS_TOKEN=
GITHUB_MODEL=

IQ_PROVIDER=mock
AZURE_SEARCH_ENDPOINT=
AZURE_SEARCH_API_KEY=
AZURE_SEARCH_INDEX=writing-companion-index
AZURE_SEARCH_API_VERSION=2025-09-01
```

For demo reliability, `IQ_PROVIDER=mock` works without Azure Search credentials. If Azure Search variables are missing or retrieval fails, the app returns mock manuscript memory instead of crashing.

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
- GitHub Models or mock AI generation
- Foundry IQ-style manuscript retrieval
- Azure AI Search-ready knowledge index integration

GitHub Copilot was used as an AI-assisted development tool during development.
