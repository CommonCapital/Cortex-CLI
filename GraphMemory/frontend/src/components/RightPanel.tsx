'use client';
import { useState } from 'react';
import ChatPanel from './ChatPanel';
import RelatedNotes from './RelatedNotes';

export default function RightPanel({ activeNoteId }: { activeNoteId: string | null }) {
  const [tab, setTab] = useState<'chat' | 'related'>('chat');

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-zinc-800/60 p-2 gap-1 bg-[#121214]">
        <button onClick={() => setTab('chat')} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${tab === 'chat' ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-zinc-700' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30'}`}>AI Chat</button>
        <button onClick={() => setTab('related')} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${tab === 'related' ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-zinc-700' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30'}`}>Related Notes</button>
      </div>
      <div className="flex-1 overflow-hidden">
        {tab === 'chat' && <ChatPanel activeNoteId={activeNoteId} />}
        {tab === 'related' && <RelatedNotes activeNoteId={activeNoteId} />}
      </div>
    </div>
  );
}
