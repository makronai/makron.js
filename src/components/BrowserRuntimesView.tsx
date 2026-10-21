import React, { useState, useEffect } from 'react';
import { Cpu, Play, CheckCircle2, AlertTriangle, ShieldCheck, Zap, Info } from 'lucide-react';
import { detectBrowserCapabilities, BrowserEnvironmentCapabilities } from '../browser/browser-capabilities';

export const BrowserRuntimesView: React.FC = () => {
  const [caps, setCaps] = useState<BrowserEnvironmentCapabilities | null>(null);
  const [activeEngine, setActiveEngine] = useState<'transformers-js' | 'webllm' | 'wllama' | 'onnx'>('transformers-js');
  const [simulating, setSimulating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedOutput, setGeneratedOutput] = useState<string>('');

  useEffect(() => {
    detectBrowserCapabilities().then(setCaps);
  }, []);

  const handleRunInference = async () => {
    setSimulating(true);
    setProgress(0);
    setGeneratedOutput('');

    // Simulate realistic model weight fetching and initialization
    for (let p = 10; p <= 100; p += 15) {
      await new Promise((r) => setTimeout(r, 120));
      setProgress(p);
    }

    setGeneratedOutput(
      `[Browser Engine: ${activeEngine.toUpperCase()}]\n` +
      `✓ Model loaded client-side into WebGPU / WASM execution buffer.\n` +
      `✓ Zero tokens sent to remote cloud APIs (100% private local execution).\n` +
      `Output: Modern browsers with WebGPU achieve over 45 tokens per second for compact reasoning models.`
    );
    setSimulating(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm">
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Cpu className="w-5 h-5 text-indigo-400" /> Client-Side Browser Runtimes Studio
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Browser inference is a first-class, separate import in Makron.js (`makron.js/browser`). Execute models directly in WebGPU, WASM, and Web Workers with complete privacy.
        </p>

        {/* Live Hardware Capabilities */}
        {caps && (
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 text-xs font-mono">
              <span className="text-zinc-500 block text-[10px]">WebGPU</span>
              <span className={caps.hasWebGPU ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                {caps.hasWebGPU ? '✓ Active' : 'Unavailable'}
              </span>
            </div>
            <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 text-xs font-mono">
              <span className="text-zinc-500 block text-[10px]">WebAssembly</span>
              <span className={caps.hasWasm ? 'text-emerald-400 font-bold' : 'text-red-400'}>
                {caps.hasWasm ? '✓ Supported' : 'No'}
              </span>
            </div>
            <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 text-xs font-mono">
              <span className="text-zinc-500 block text-[10px]">Cross-Origin Isolated</span>
              <span className={caps.isCrossOriginIsolated ? 'text-emerald-400 font-bold' : 'text-zinc-400'}>
                {caps.isCrossOriginIsolated ? '✓ COOP/COEP' : 'Single-thread'}
              </span>
            </div>
            <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 text-xs font-mono">
              <span className="text-zinc-500 block text-[10px]">SharedArrayBuffer</span>
              <span className={caps.hasSharedArrayBuffer ? 'text-emerald-400 font-bold' : 'text-zinc-400'}>
                {caps.hasSharedArrayBuffer ? '✓ Available' : 'No'}
              </span>
            </div>
            <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 text-xs font-mono">
              <span className="text-zinc-500 block text-[10px]">Device RAM</span>
              <span className="text-zinc-200">{caps.deviceMemoryGB ? `${caps.deviceMemoryGB} GB` : 'Standard'}</span>
            </div>
            <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 text-xs font-mono">
              <span className="text-zinc-500 block text-[10px]">CPU Threads</span>
              <span className="text-zinc-200">{caps.hardwareConcurrency || 4} Cores</span>
            </div>
          </div>
        )}
      </div>

      {/* Engine Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            id: 'transformers-js',
            name: 'Transformers.js',
            backend: 'WebGPU / WASM',
            format: 'ONNX Artifacts',
            description: 'Full text generation and client-side feature extraction for zero-cloud embeddings.',
            sampleModel: 'onnx-community/SmolLM2-360M-Instruct',
          },
          {
            id: 'webllm',
            name: 'WebLLM (MLC)',
            backend: 'Native WebGPU',
            format: 'MLC Compiled',
            description: 'GPU-compiled shaders delivering up to 60+ tokens/sec on modern hardware.',
            sampleModel: 'Llama-3.2-1B-Instruct-q4f32_1-MLC',
          },
          {
            id: 'wllama',
            name: 'Wllama Engine',
            backend: 'WASM + Workers',
            format: 'GGUF Quantized',
            description: 'Run arbitrary quantized GGUF models directly in web browser worker threads.',
            sampleModel: 'SmolLM2-1.7B-Instruct.Q4_K_M.gguf',
          },
          {
            id: 'onnx',
            name: 'ONNX Runtime Web',
            backend: 'WebGPU / WASM',
            format: 'Raw ONNX Tensors',
            description: 'Generic tensor execution engine for custom model architectures and classifiers.',
            sampleModel: 'custom-encoder.onnx',
          },
        ].map((eng) => (
          <button
            key={eng.id}
            onClick={() => setActiveEngine(eng.id as any)}
            className={`p-5 rounded-xl border text-left transition-all cursor-pointer ${
              activeEngine === eng.id
                ? 'bg-zinc-800/90 border-indigo-500 shadow-md ring-1 ring-indigo-500'
                : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">{eng.name}</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-950 text-indigo-400 border border-zinc-800">
                {eng.backend}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{eng.description}</p>
            <div className="mt-3 pt-3 border-t border-zinc-800/80 text-[11px] font-mono text-zinc-500">
              Format: <span className="text-zinc-300">{eng.format}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Interactive In-Browser Runner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Browser Inference Test Runner</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Simulate in-memory weight loading and execution for {activeEngine}.
            </p>
          </div>
          <button
            onClick={handleRunInference}
            disabled={simulating}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{simulating ? 'Running in Browser...' : 'Execute Test Run'}</span>
          </button>
        </div>

        {simulating && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono text-zinc-400">
              <span>Loading model weights into GPU buffer...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-800">
              <div
                className="bg-indigo-500 h-2 rounded-full transition-all duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {generatedOutput && (
          <div className="p-4 bg-zinc-950 rounded-lg border border-zinc-800 font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
            {generatedOutput}
          </div>
        )}
      </div>
    </div>
  );
};
