import React, { useState } from 'react';
import { Send, Zap, Wrench, RefreshCw, CheckCircle, Database } from 'lucide-react';
import { createMakron } from '../core/client';
import { Message, ToolDefinition } from '../core/types';
import { listModels } from '../models/registry';
import { contentToString } from '../core/messages';

export const PlaygroundView: React.FC = () => {
  const [provider, setProvider] = useState<string>('openai');
  const [model, setModel] = useState<string>('gpt-5-mini');
  const [temperature, setTemperature] = useState<number>(0.7);
  const [maxTokens, setMaxTokens] = useState<number>(512);
  const [enableTools, setEnableTools] = useState<boolean>(false);
  const [inputPrompt, setInputPrompt] = useState<string>('Explain how vector databases and embeddings work.');
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [messages, setMessages] = useState<Array<Message & { latencyMs?: number; tokens?: number; toolCalls?: any[] }>>([
    {
      role: 'assistant',
      content: 'Welcome to Makron.js Playground! Choose any hosted provider, local Ollama endpoint, or client-side browser runtime to test unified completions and streaming.',
    },
  ]);

  const availableModels = listModels({ provider });

  const sampleTool: ToolDefinition = {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Fetch current weather and atmospheric conditions',
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string', description: 'City name' },
        },
        required: ['city'],
      },
    },
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrompt.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: inputPrompt };
    setMessages((prev) => [...prev, userMessage]);
    setInputPrompt('');
    setIsLoading(true);

    const client = createMakron({
      provider,
      model,
      apiKey: apiKey.trim() || undefined,
      // Zero-config mock fallback when no external API key is entered
      mockTransport: !apiKey.trim()
        ? async (opts: any) => {
            if (opts.stream) {
              const words = [
                'Makron.js ',
                'normalizes ',
                'responses ',
                'across ',
                'all ',
                'providers. ',
                'Vector ',
                'embeddings ',
                'map ',
                'text ',
                'into ',
                'high-dimensional ',
                'space, ',
                'allowing ',
                'cosine ',
                'similarity ',
                'search ',
                'for ',
                'accurate ',
                'RAG.',
              ];
              return words.map((w, idx) => ({
                id: `chunk-${idx}`,
                model,
                provider,
                deltaText: w,
              }));
            }

            if (enableTools) {
              return {
                id: `resp-${Date.now()}`,
                model,
                choices: [
                  {
                    message: {
                      role: 'assistant',
                      content: `I will check the weather for you using the get_weather tool.`,
                      tool_calls: [
                        {
                          id: 'call_mock_1',
                          function: {
                            name: 'get_weather',
                            arguments: JSON.stringify({ city: 'San Francisco' }),
                          },
                        },
                      ],
                    },
                    finish_reason: 'tool_calls',
                  },
                ],
                usage: { prompt_tokens: 45, completion_tokens: 30, total_tokens: 75 },
              };
            }

            return {
              id: `resp-${Date.now()}`,
              model,
              choices: [
                {
                  message: {
                    role: 'assistant',
                    content: `[Simulated ${provider} response]: Vector databases store mathematical representations of data (embeddings). Instead of exact keyword matching, they compute proximity in multi-dimensional space, retrieving semantically related documents in milliseconds.`,
                  },
                  finish_reason: 'stop',
                },
              ],
              usage: { prompt_tokens: 32, completion_tokens: 48, total_tokens: 80 },
            };
          }
        : undefined,
    });

    const startTime = Date.now();

    try {
      if (isStreaming) {
        // Prepare assistant message
        setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

        let accumulatedText = '';
        for await (const chunk of client.stream({
          messages: [...messages, userMessage],
          temperature,
          maxTokens,
          tools: enableTools ? [sampleTool] : undefined,
        })) {
          accumulatedText += chunk.deltaText;
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last && last.role === 'assistant') {
              last.content = accumulatedText;
            }
            return next;
          });
        }

        const latencyMs = Date.now() - startTime;
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last) {
            last.latencyMs = latencyMs;
            last.tokens = Math.round(accumulatedText.split(/\s+/).length * 1.3);
          }
          return next;
        });
      } else {
        const response = await client.chat({
          messages: [...messages, userMessage],
          temperature,
          maxTokens,
          tools: enableTools ? [sampleTool] : undefined,
        });

        const latencyMs = Date.now() - startTime;
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: response.text,
            toolCalls: response.toolCalls,
            latencyMs,
            tokens: response.usage.totalTokens,
          },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Error (${err.name || 'Error'}): ${err.message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar: Controls */}
        <aside className="lg:col-span-1 space-y-5 bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-400" /> Model Configuration
            </h2>
            <p className="text-xs text-zinc-400 mt-1">Configure target provider & parameters</p>
          </div>

          <div>
            <label htmlFor="provider-select" className="block text-xs font-medium text-zinc-300 mb-1.5">
              Provider
            </label>
            <select
              id="provider-select"
              value={provider}
              onChange={(e) => {
                const newProv = e.target.value;
                setProvider(newProv);
                const models = listModels({ provider: newProv });
                if (models.length > 0) setModel(models[0].id);
              }}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="openai">OpenAI (GPT-5, mini)</option>
              <option value="gemini">Google Gemini (3.8 Flash)</option>
              <option value="anthropic">Anthropic (Claude 3.5)</option>
              <option value="groq">Groq (LPU Ultra-Fast)</option>
              <option value="deepseek">DeepSeek (Flash, V4 Pro)</option>
              <option value="ollama">Ollama (Local Endpoint)</option>
              <option value="qwen">Alibaba Cloud (Qwen 3.8)</option>
              <option value="zai">Z.ai (GLM 5.3)</option>
              <option value="mistral">Mistral AI (Large 2411)</option>
              <option value="cohere">Cohere (Command R+)</option>
              <option value="transformers-js">Transformers.js (Browser ONNX)</option>
            </select>
          </div>

          <div>
            <label htmlFor="model-select" className="block text-xs font-medium text-zinc-300 mb-1.5">
              Model
            </label>
            <select
              id="model-select"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {availableModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.displayName || m.id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="api-key-input" className="block text-xs font-medium text-zinc-300 mb-1.5">
              API Key (Optional)
            </label>
            <input
              id="api-key-input"
              type="password"
              placeholder="Leave blank for Zero-Config Demo Mode"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
            <p className="text-[10px] text-zinc-500 mt-1">
              Protected by automatic client-side key redaction.
            </p>
          </div>

          <div className="space-y-3 pt-3 border-t border-zinc-800">
            <div>
              <div className="flex justify-between text-xs text-zinc-400 mb-1">
                <label htmlFor="temp-range">Temperature</label>
                <span className="font-mono text-zinc-200">{temperature}</span>
              </div>
              <input
                id="temp-range"
                type="range"
                min="0"
                max="1.5"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-zinc-400 mb-1">
                <label htmlFor="max-tokens-range">Max Tokens</label>
                <span className="font-mono text-zinc-200">{maxTokens}</span>
              </div>
              <input
                id="max-tokens-range"
                type="range"
                min="64"
                max="2048"
                step="64"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-zinc-800">
            <label className="flex items-center space-x-2 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isStreaming}
                onChange={(e) => setIsStreaming(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-950 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Enable SSE Token Streaming</span>
            </label>

            <label className="flex items-center space-x-2 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={enableTools}
                onChange={(e) => setEnableTools(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-950 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Enable Tool Calling (get_weather)</span>
            </label>
          </div>

          <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800/80 text-xs text-zinc-400">
            <span className="font-semibold text-zinc-300 flex items-center gap-1.5 mb-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Zero-Config Sandbox
            </span>
            Simulated high-fidelity responses are active whenever API keys are omitted.
          </div>
        </aside>

        {/* Right Section: Chat & Messages */}
        <main className="lg:col-span-3 flex flex-col bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm h-[650px]">
          {/* Header Bar */}
          <div className="px-5 py-3 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-zinc-400">Active Target:</span>
              <span className="font-mono text-zinc-200 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                {provider} / {model}
              </span>
            </div>
            <button
              onClick={() =>
                setMessages([
                  {
                    role: 'assistant',
                    content: 'Conversation history reset. Ask a question or test tool calling.',
                  },
                ])
              }
              className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 hover:underline cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Clear Chat
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-2xl rounded-xl px-4 py-3 text-sm leading-relaxed ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-br-none shadow-sm'
                        : 'bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-bl-none shadow-sm'
                    }`}
                  >
                    <div className="font-semibold text-xs opacity-75 mb-1">
                      {isUser ? 'You' : `${provider} (${model})`}
                    </div>
                    <div className="whitespace-pre-wrap">{contentToString(msg.content)}</div>

                    {msg.toolCalls && msg.toolCalls.length > 0 && (
                      <div className="mt-3 p-2.5 rounded bg-zinc-900 border border-zinc-800 text-xs font-mono space-y-1">
                        <div className="text-amber-400 flex items-center gap-1">
                          <Wrench className="w-3 h-3" /> Tool Call Triggered:
                        </div>
                        {msg.toolCalls.map((tc, idx) => (
                          <div key={idx} className="text-zinc-300">
                            {tc.name}({typeof tc.arguments === 'string' ? tc.arguments : JSON.stringify(tc.arguments)})
                          </div>
                        ))}
                      </div>
                    )}

                    {!isUser && (msg.latencyMs !== undefined || msg.tokens !== undefined) && (
                      <div className="mt-2 text-[10px] text-zinc-500 flex items-center gap-3 pt-1 border-t border-zinc-800/60 font-mono">
                        {msg.latencyMs !== undefined && <span>{msg.latencyMs}ms latency</span>}
                        {msg.tokens !== undefined && <span>{msg.tokens} tokens</span>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-zinc-950 border border-zinc-800 text-zinc-400 px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  <span>Makron.js resolving request...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSend} className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center space-x-3">
            <input
              type="text"
              aria-label="User message prompt"
              placeholder="Ask anything or test a capability (e.g. 'What is the weather in Tokyo?')..."
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={isLoading || !inputPrompt.trim()}
              aria-label="Send message"
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </main>
      </div>
    </div>
  );
};
