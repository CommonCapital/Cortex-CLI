'use client';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function NoteList({ activeNoteId, onSelect }: { activeNoteId: string | null, onSelect: (id: string) => void }) {
  const { data: notes, mutate } = useSWR('/api/notes', fetcher);

  const createNote = async () => {
    const res = await fetch('/api/notes', {
      method: 'POST',
      body: JSON.stringify({ title: 'Untitled Note', content: '' })
    });
    const note = await res.json();
    mutate();
    onSelect(note.id);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="p-3">
        <button onClick={createNote} className="w-full py-2 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 rounded-md text-sm font-medium transition-colors border border-purple-500/20 shadow-sm flex items-center justify-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Note
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5">
        {notes?.map((note: any) => (
          <button
            key={note.id}
            onClick={() => onSelect(note.id)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-all duration-200 ${activeNoteId === note.id ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-zinc-700' : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'}`}
          >
            {note.title || 'Untitled Note'}
          </button>
        ))}
      </div>
    </div>
  );
}
