'use client';
import { useState } from 'react';
import useSWR from 'swr';

export default function CommandPalette({ onClose, onSelect }: { onClose: () => void, onSelect: (id: string) => void }) {
  const [search, setSearch] = useState('');
  const { data: notes } = useSWR('/api/notes', (url) => fetch(url).then(r => r.json()));
  
  const filtered = notes?.filter((n: any) => n.title?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#1a1a1c] border border-zinc-800 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-zinc-800 flex items-center">
          <svg className="w-5 h-5 text-zinc-500 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input 
            autoFocus
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-zinc-500 text-lg"
            placeholder="Search notes or type a command..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button onClick={onClose} className="text-xs border border-zinc-700 text-zinc-500 px-1.5 py-0.5 rounded ml-2">ESC</button>
        </div>
        <div className="max-h-[300px] overflow-y-auto p-2">
          {filtered?.map((note: any) => (
            <button key={note.id} onClick={() => { onSelect(note.id); onClose(); }} className="w-full text-left px-4 py-3 hover:bg-purple-500/10 hover:text-purple-300 text-zinc-300 rounded-lg transition-colors flex items-center justify-between group">
              <span className="font-medium">{note.title || 'Untitled'}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider bg-zinc-800 group-hover:bg-purple-500/20 group-hover:text-purple-400 text-zinc-500 px-2 py-0.5 rounded transition-colors">Note</span>
            </button>
          ))}
          {filtered?.length === 0 && <div className="p-8 text-center text-sm text-zinc-500">No results found for "{search}"</div>}
        </div>
      </div>
    </div>
  );
}
