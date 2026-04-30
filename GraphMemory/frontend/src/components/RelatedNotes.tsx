'use client';
import useSWR from 'swr';

export default function RelatedNotes({ activeNoteId }: { activeNoteId: string | null }) {
  const { data } = useSWR(activeNoteId ? `/api/graph/similar-notes/${activeNoteId}` : null, url => fetch(url).then(r => r.json()));

  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto bg-[#121214]">
      {!activeNoteId ? (
        <div className="text-center flex flex-col items-center text-zinc-500 text-sm mt-10">
          <div className="w-12 h-12 rounded-full bg-zinc-800/50 flex items-center justify-center mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          </div>
          Select a note to see relationships.
        </div>
      ) : (
        <>
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 px-1">Similar Notes</h3>
          {data?.notes?.length > 0 ? data.notes.map((n: any, i: number) => (
            <div key={i} className="p-4 bg-[#1e1e21] rounded-xl hover:bg-zinc-800 cursor-pointer transition-all duration-200 border border-zinc-800/80 shadow-sm hover:shadow-md hover:-translate-y-0.5">
              <div className="font-medium text-sm text-zinc-200">{n.title || 'Untitled'}</div>
              <div className="text-xs text-zinc-500 mt-2 flex justify-between items-center">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Vector match
                </span>
                <span className="text-blue-400 font-mono bg-blue-500/10 px-1.5 py-0.5 rounded">{Math.round(n.score * 100)}%</span>
              </div>
            </div>
          )) : <div className="text-sm text-zinc-600 px-1">No similar notes found.</div>}
        </>
      )}
    </div>
  );
}
