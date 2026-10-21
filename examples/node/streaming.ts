/**
 * Makron.js Real-Time Token Streaming Example
 */
import { createMakron } from '../../src/index';

async function main() {
  const ai = createMakron({
    provider: 'groq',
    apiKey: process.env.GROQ_API_KEY,
    model: 'openai/gpt-oss-120b',
  });

  process.stdout.write('Streaming response: ');
  for await (const chunk of ai.stream({
    messages: [{ role: 'user', content: 'Write a quick 4-line poem about latency.' }],
  })) {
    process.stdout.write(chunk.deltaText);
  }
  console.log('\nDone.');
}

main().catch(console.error);
