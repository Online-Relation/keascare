// src/lib/api/AnthropicClient/anthropicClient.ts

import Anthropic from '@anthropic-ai/sdk';

let klient: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!klient) {
    klient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return klient;
}
