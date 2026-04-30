'use client';
import { useState } from 'react';

export default function MemoryDashboard() {
  const [isOpen, setIsOpen] = useState(false);
  const [indexing, setIndexing] = useState(false);

  const reindexVector = async () => {
    setIndexing(true);
    await fetch('/api/vector/reindex', { method: 'POST' });
    setTimeout(() => setIndexing(false), 2000);
  };

  const reextractGraph = async () => {
    setIndexing(true);
    await fetch('/api/graph/reextract', { method: 'POST' });
    setTimeout(() => setIndexing(false), 2000);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-0 left-0 right-0 h-8 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between px-4 text-[10px] text-zinc-500 font-mono z-50 hover:bg-zinc-800 transition-colors cursor-pointer" onClick={() => setIsOpen(true)}>
        <span>MEMORY HEALTH STATUS</span>
        <span>Click to expand dashboard</span>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#161618] border-t border-zinc-800 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-50 animate-in slide-in-from-bottom-10 duration-300">
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800/50 bg-[#121214]">
        <h2 className="text-xs font-bold text-zinc-300 tracking-wider">MEMORY HEALTH DASHBOARD</h2>
        <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div className="p-6 flex gap-8">
        <div className="flex-1 space-y-4">
          <h3 className="text-xs text-zinc-500 font-semibold uppercase">Vector Memory</h3>
          <div className="flex justify-between items-center bg-zinc-900 p-3 rounded-lg border border-zinc-800">
            <div>
              <div className="text-2xl font-bold text-blue-400">Model</div>
              <div className="text-[10px] text-zinc-500">all-MiniLM-L6-v2 (384d)</div>
            </div>
            <button onClick={reindexVector} disabled={indexing} className="bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded text-xs border border-blue-500/20 hover:bg-blue-500/20">
              {indexing ? 'Indexing...' : 'Re-index All'}
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <h3 className="text-xs text-zinc-500 font-semibold uppercase">Graph Memory</h3>
          <div className="flex justify-between items-center bg-zinc-900 p-3 rounded-lg border border-zinc-800">
            <div>
              <div className="text-2xl font-bold text-emerald-400">Extractor</div>
              <div className="text-[10px] text-zinc-500">claude-3-haiku</div>
            </div>
            <button onClick={reextractGraph} disabled={indexing} className="bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded text-xs border border-emerald-500/20 hover:bg-emerald-500/20">
              {indexing ? 'Extracting...' : 'Re-extract All'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
