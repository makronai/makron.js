/**
 * @license MIT
 * Makron.js Developer Studio & Interactive Playground
 */

import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { PlaygroundView } from './components/PlaygroundView';
import { ModelCatalogView } from './components/ModelCatalogView';
import { IntegrationMatrixView } from './components/IntegrationMatrixView';
import { BrowserRuntimesView } from './components/BrowserRuntimesView';
import { PackageReleaseView } from './components/PackageReleaseView';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('playground');

  useEffect(() => {
    // Read query parameter for direct tab linking / automated verification
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab') as ActiveTab | null;
    if (tabParam && ['playground', 'catalog', 'integrations', 'browser', 'release'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 pb-12">
        {activeTab === 'playground' && <PlaygroundView />}
        {activeTab === 'catalog' && (
          <ModelCatalogView
            onSelectModel={(provider, modelId) => {
              setActiveTab('playground');
            }}
          />
        )}
        {activeTab === 'integrations' && <IntegrationMatrixView />}
        {activeTab === 'browser' && <BrowserRuntimesView />}
        {activeTab === 'release' && <PackageReleaseView />}
      </main>

      <footer className="border-t border-zinc-900 bg-zinc-950 py-6 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Makron.js v0.1.0 • MIT Open-Source AI Integration Engine</span>
          <div className="flex items-center space-x-4">
            <button onClick={() => setActiveTab('playground')} className="hover:text-zinc-300 cursor-pointer">
              Playground
            </button>
            <button onClick={() => setActiveTab('catalog')} className="hover:text-zinc-300 cursor-pointer">
              Catalog
            </button>
            <button onClick={() => setActiveTab('integrations')} className="hover:text-zinc-300 cursor-pointer">
              Integrations
            </button>
            <button onClick={() => setActiveTab('browser')} className="hover:text-zinc-300 cursor-pointer">
              WebGPU
            </button>
            <button onClick={() => setActiveTab('release')} className="hover:text-zinc-300 cursor-pointer">
              Release Gates
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
