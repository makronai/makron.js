/**
 * Makron.js Hosted OpenAI Example
 */
import { createMakron } from '../../src/index';

async function main() {
  const ai = createMakron({
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-5-mini',
  });

  const response = await ai.chat({
    messages: [
      { role: 'system', content: 'You are a helpful software engineering assistant.' },
      { role: 'user', content: 'What are the main advantages of TypeScript?' },
    ],
    temperature: 0.5,
  });

  console.log('Model Response:\n', response.text);
  console.log(`Latency: ${response.latencyMs}ms | Tokens: ${response.usage.totalTokens}`);
}

main().catch(console.error);
