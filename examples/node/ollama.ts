/**
 * Makron.js Local Ollama Example (No API Key Required)
 */
import { createMakron } from '../../src/index';

async function main() {
  const ai = createMakron({
    provider: 'ollama',
    baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1',
    model: 'gpt-oss:20b',
  });

  const response = await ai.chat({
    messages: [
      { role: 'user', content: 'Explain zero-shot learning.' },
    ],
  });

  console.log('Local Ollama response:', response.text);
}

main().catch(console.error);
