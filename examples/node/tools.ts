/**
 * Makron.js Function Calling and Tool Execution Example
 */
import { createMakron, defineTool, executeToolCalls } from '../../src/index';

const weatherTool = defineTool(
  'get_weather',
  'Get current weather for a specified location',
  {
    type: 'object',
    properties: {
      location: { type: 'string', description: 'City and country, e.g. Tokyo, JP' },
    },
    required: ['location'],
  },
  async ({ location }) => {
    return { location, temperature: 24, condition: 'Sunny', windKph: 12 };
  }
);

async function main() {
  const ai = createMakron({
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-5-mini',
  });

  const response = await ai.chat({
    messages: [{ role: 'user', content: 'What is the weather in Tokyo right now?' }],
    tools: [weatherTool.definition],
  });

  if (response.toolCalls && response.toolCalls.length > 0) {
    console.log('Model called tool:', response.toolCalls);
    const results = await executeToolCalls(response.toolCalls, [weatherTool]);
    console.log('Tool execution output:', results);
  } else {
    console.log('Response:', response.text);
  }
}

main().catch(console.error);
