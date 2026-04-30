'use client';

import { useState, useEffect } from 'react';
import NoteList from '@/components/NoteList';
import Editor from '@/components/Editor';
import RightPanel from '@/components/RightPanel';
import GraphView from '@/components/GraphView';
import CommandPalette from '@/components/CommandPalette';
import VectorMemoryView from '@/components/VectorMemoryView';
import MemoryDashboard from '@/components/MemoryDashboard';

export default function Home() {
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [showPalette, setShowPalette] = useState(false);
  const [activeTab, setActiveTab] = useState<'notes' | 'memory' | 'settings'>('notes');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowPalette(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <main className="flex flex-col h-screen bg-[#0f0f11] text-zinc-100 font-sans overflow-hidden selection:bg-purple-500/30">
      <div className="h-14 border-b border-zinc-800/60 flex items-center justify-between px-6 bg-[#161618]/80 backdrop-blur-xl z-20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-purple-500/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            </div>
            <h1 className="font-bold text-lg tracking-tight text-white">MemoryOS</h1>
          </div>
          <div className="flex gap-1 bg-zinc-900/80 p-1 rounded-lg border border-zinc-800/60 shadow-inner">
            <button onClick={() => setActiveTab('notes')} className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${activeTab === 'notes' ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-zinc-700' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40'}`}>Notes</button>
            <button onClick={() => setActiveTab('memory')} className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${activeTab === 'memory' ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-zinc-700' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40'}`}>Memory</button>
            <button onClick={() => setActiveTab('settings')} className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${activeTab === 'settings' ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-zinc-700' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40'}`}>Settings</button>
          </div>
        </div>
        <button onClick={() => setShowPalette(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:text-zinc-300 transition-colors text-zinc-500 text-xs shadow-inner">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <span>Search...</span>
          <span className="font-mono bg-zinc-800 px-1 rounded ml-2">⌘K</span>
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {activeTab === 'notes' && (
          <>
            <div className="w-64 border-r border-zinc-800/60 flex flex-col bg-[#161618]/80 backdrop-blur-xl">
              <NoteList activeNoteId={activeNoteId} onSelect={setActiveNoteId} />
            </div>

            <div className="flex-1 flex flex-col relative bg-[#0f0f11]">
              <div className="flex-1 overflow-auto w-full">
                {activeNoteId ? <Editor noteId={activeNoteId} /> : <div className="h-full flex flex-col items-center justify-center text-zinc-500"><div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-tr from-purple-500/10 to-indigo-500/10 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400/50"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg></div><p>Select or create a note to begin</p></div>}
              </div>
            </div>

            <div className="w-[340px] border-l border-zinc-800/60 bg-[#121214] flex flex-col shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.5)]">
              <RightPanel activeNoteId={activeNoteId} />
            </div>
          </>
        )}

        {activeTab === 'memory' && (
          <div className="flex-1 flex bg-[#0f0f11] overflow-hidden">
            <div className="flex-1 border-r border-zinc-800/60 relative flex flex-col bg-[#121214]">
              <div className="absolute top-4 left-6 z-10 px-3 py-1 bg-zinc-800/80 rounded border border-zinc-700/50 text-[10px] font-bold text-zinc-300 uppercase tracking-wider backdrop-blur-sm shadow-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Graph Explorer
              </div>
              <GraphView />
            </div>
            <div className="flex-1 relative flex flex-col bg-[#121214]">
              <div className="absolute top-4 left-6 z-10 px-3 py-1 bg-zinc-800/80 rounded border border-zinc-700/50 text-[10px] font-bold text-zinc-300 uppercase tracking-wider backdrop-blur-sm shadow-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                Vector Cluster Map
              </div>
              <VectorMemoryView onNoteSelect={(id) => { setActiveNoteId(id); setActiveTab('notes'); }} />
            </div>
          </div>
        )}
        
        {activeTab === 'settings' && (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 bg-[#0f0f11]">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </div>
            <p>Settings coming soon...</p>
          </div>
        )}
      </div>

      <MemoryDashboard />

      {showPalette && (
        <CommandPalette onClose={() => setShowPalette(false)} onSelect={(id) => { setActiveNoteId(id); setActiveTab('notes'); }} />
      )}
    </main>
  );
}
