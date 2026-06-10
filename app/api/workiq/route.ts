import { NextRequest } from 'next/server'
import { POST as foundryIQPost } from '../foundryiq/route'

// Deprecated alias. NulisIQ now uses Foundry IQ-style manuscript knowledge retrieval instead of Work IQ mock memory.
export async function POST(req: NextRequest) {
  return foundryIQPost(req)
}
