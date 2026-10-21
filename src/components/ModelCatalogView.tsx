import React, { useState } from 'react';
import { Search, Globe, HardDrive, Cpu, ExternalLink, Check, Eye, Shield, Sparkles } from 'lucide-react';
import { listModels } from '../models/registry';
import { ModelInfo } from '../core/types';

interface ModelCatalogViewProps {
  onSelectModel?: (provider: string, modelId: string) => void;
}

export const ModelCatalogView: React.FC<ModelCatalogViewProps> = ({ onSelectModel }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [selectedAvailability, setSelectedAvailability] = useState<string>('all');
  const [selectedCapability, setSelectedCapability] = useState<string>('all');

  const allModels = listModels();

  const filteredModels = allModels.filter((model) => {
    if (selectedProvider !== 'all' && model.provider !== selectedProvider) {
      return false;
    }
    if (selectedAvailability !== 'all' && model.availability !== selectedAvailability) {
      return false;
    }
    if (selectedCapability !== 'all') {
      if (!model.capabilities || !(model.capabilities as any)[selectedCapability]) {
        return false;
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = model.id.toLowerCase().includes(q);
      const matchName = model.displayName?.toLowerCase().includes(q);
      const matchDesc = model.description?.toLowerCase().includes(q);
      if (!matchId && !matchName && !matchDesc) return false;
    }
    return true;
  });

  const providers = Array.from(new Set(allModels.map((m) => m.provider)));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-400" /> Makron.js Live Model Catalog
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Treating model IDs as verified data. Browse 60+ verified models or test runtime discovery across hosted, local, and browser targets.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{filteredModels.length} of {allModels.length} models matched</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl">
        {/* Search */}
        <div className="relative">
          <label htmlFor="catalog-search" className="sr-only">Search models</label>
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
          <input
            id="catalog-search"
            type="text"
            placeholder="Search by ID, name, or task..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Provider Filter */}
        <div>
          <label htmlFor="filter-provider" className="sr-only">Filter by Provider</label>
          <select
            id="filter-provider"
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs sm:text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Providers ({providers.length})</option>
            {providers.map((p) => (
              <option key={p} value={p}>
                {p.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Availability Filter */}
        <div>
          <label htmlFor="filter-availability" className="sr-only">Filter by Availability</label>
          <select
            id="filter-availability"
            value={selectedAvailability}
            onChange={(e) => setSelectedAvailability(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs sm:text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Targets (Hosted, Local, Browser)</option>
            <option value="hosted">☁️ Hosted Cloud APIs</option>
            <option value="local">🖥️ Local Endpoints (Ollama/vLLM)</option>
            <option value="browser">⚡ Browser In-Memory (WebGPU)</option>
          </select>
        </div>

        {/* Capability Filter */}
        <div>
          <label htmlFor="filter-capability" className="sr-only">Filter by Capability</label>
          <select
            id="filter-capability"
            value={selectedCapability}
            onChange={(e) => setSelectedCapability(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs sm:text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Capabilities</option>
            <option value="tools">🛠️ Tool Calling Support</option>
            <option value="vision">👁️ Vision & Multimodal</option>
            <option value="reasoning">🧠 Deep Thought & Reasoning</option>
            <option value="embeddings">📐 Vector Embeddings</option>
            <option value="reranking">🎯 Semantic Reranking</option>
          </select>
        </div>
      </div>

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredModels.map((model) => (
          <div
            key={`${model.provider}-${model.id}`}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors flex flex-col justify-between shadow-sm"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                  {model.provider}
                </span>

                <div className="flex items-center gap-1.5">
                  {model.availability === 'browser' && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 flex items-center gap-1">
                      <Cpu className="w-3 h-3" /> Browser
                    </span>
                  )}
                  {model.availability === 'local' && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1">
                      <HardDrive className="w-3 h-3" /> Local
                    </span>
                  )}
                  {model.availability === 'hosted' && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 flex items-center gap-1">
                      <Globe className="w-3 h-3" /> Hosted
                    </span>
                  )}
                </div>
              </div>

              <h2 className="text-sm font-bold text-white mt-2.5 tracking-tight">
                {model.displayName || model.id}
              </h2>
              <div className="text-xs font-mono text-zinc-400 mt-0.5 select-all">
                {model.id}
              </div>

              <p className="text-xs text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                {model.description || 'Verified model in the Makron.js catalog.'}
              </p>

              {/* Specs */}
              <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center gap-4 text-xs font-mono text-zinc-400">
                {model.contextWindow ? (
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Context</span>
                    <span>{(model.contextWindow / 1000).toFixed(0)}k</span>
                  </div>
                ) : null}
                {model.maxOutputTokens ? (
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Max Out</span>
                    <span>{(model.maxOutputTokens / 1000).toFixed(0)}k</span>
                  </div>
                ) : null}
                <div>
                  <span className="text-zinc-500 block text-[10px]">Lifecycle</span>
                  <span className="capitalize">{model.lifecycle || 'stable'}</span>
                </div>
              </div>

              {/* Capability Chips */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {model.capabilities.tools && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                    🛠️ Tools
                  </span>
                )}
                {model.capabilities.vision && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                    👁️ Vision
                  </span>
                )}
                {model.capabilities.reasoning && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                    🧠 Reasoning
                  </span>
                )}
                {model.capabilities.embeddings && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                    📐 Embeddings
                  </span>
                )}
                {model.capabilities.reranking && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                    🎯 Rerank
                  </span>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between">
              {model.sourceURL ? (
                <a
                  href={model.sourceURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  Docs <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="text-xs text-zinc-500">Verified</span>
              )}

              {onSelectModel && (
                <button
                  onClick={() => onSelectModel(model.provider, model.id)}
                  className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-2.5 py-1 rounded transition-colors cursor-pointer"
                >
                  Use in Playground
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
