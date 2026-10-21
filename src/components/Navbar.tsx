import React from 'react';
import { Cpu, Layers, Sparkles, Terminal, ShieldCheck, Box } from 'lucide-react';
import { VERSION } from '../version';

export type ActiveTab = 'playground' | 'catalog' | 'integrations' | 'browser' | 'release';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const tabs: Array<{ id: ActiveTab; label: string; icon: React.ReactNode }> = [
    { id: 'playground', label: 'Interactive Playground', icon: <Terminal className="w-4 h-4" /> },
    { id: 'catalog', label: 'Model Catalog & Discovery', icon: <Layers className="w-4 h-4" /> },
    { id: 'integrations', label: 'Integration Matrix', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'browser', label: 'Browser Runtimes (WebGPU)', icon: <Cpu className="w-4 h-4" /> },
    { id: 'release', label: 'Package & Release Gates', icon: <Box className="w-4 h-4" /> },
  ];

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold tracking-wider shadow-md shadow-indigo-500/20">
              M
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-white tracking-tight">Makron.js</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800 font-mono">
                  v{VERSION}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono hidden sm:inline-flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Production Ready
                </span>
              </div>
              <p className="text-xs text-zinc-400 hidden sm:block">Unified AI & Model Integration Layer</p>
            </div>
          </div>

          <nav className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-2" aria-label="Main Navigation">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
