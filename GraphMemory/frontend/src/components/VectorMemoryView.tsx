'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import useSWR from 'swr';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export default function VectorMemoryView({ onNoteSelect }: { onNoteSelect: (id: string) => void }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadProjection = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vector', {
        method: 'POST',
        body: JSON.stringify({ method: 'umap', n_neighbors: 15 })
      });
      const json = await res.json();
      setData(json);
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjection();
  }, []);

  const trace = {
    x: data.map(d => d.x),
    y: data.map(d => d.y),
    text: data.map(d => d.title),
    customdata: data.map(d => d.id),
    mode: 'markers',
    type: 'scatter',
    marker: {
      size: 10,
      color: '#a855f7',
      opacity: 0.8,
      line: {
        width: 1,
        color: '#1e1e21'
      }
    },
    hoverinfo: 'text'
  };

  return (
    <div className="flex flex-col h-full bg-[#0f0f11] relative">
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button onClick={loadProjection} disabled={loading} className="px-3 py-1 bg-zinc-800 text-xs text-zinc-300 rounded hover:bg-zinc-700 transition-colors">
          {loading ? 'Projecting...' : 'Recalculate UMAP'}
        </button>
      </div>
      
      <div className="flex-1 w-full relative">
        {data.length === 0 && !loading ? (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-500">No vector data.</div>
        ) : (
          <Plot
            data={[trace] as any}
            layout={{
              autosize: true,
              paper_bgcolor: 'transparent',
              plot_bgcolor: 'transparent',
              xaxis: { showgrid: false, zeroline: false, showticklabels: false },
              yaxis: { showgrid: false, zeroline: false, showticklabels: false },
              margin: { l: 0, r: 0, t: 0, b: 0 },
              hovermode: 'closest',
            }}
            useResizeHandler={true}
            style={{ width: '100%', height: '100%' }}
            onClick={(e) => {
              if (e.points && e.points[0]) {
                const id = e.points[0].customdata;
                if (id) onNoteSelect(id as string);
              }
            }}
          />
        )}
      </div>

      <RetrievalInspector />
    </div>
  );
}

function RetrievalInspector() {
  const { data } = useSWR('/api/retrieval?session_id=default', url => fetch(url).then(r => r.json()), { refreshInterval: 2000 });

  if (!data || !data.merged_results || data.merged_results.length === 0) {
    return (
      <div className="h-64 border-t border-zinc-800/60 bg-[#161618] p-4 flex items-center justify-center text-zinc-500 text-sm">
        Ask a question in the chat to see the retrieval trace.
      </div>
    );
  }

  return (
    <div className="h-72 border-t border-zinc-800/60 bg-[#121214] flex flex-col">
      <div className="p-3 border-b border-zinc-800 flex justify-between items-center">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Retrieval Inspector</h3>
        <div className="flex gap-4 text-[10px] text-zinc-500 font-mono">
          <span>Vector: {data.vector_results?.length || 0} hits</span>
          <span>Graph: {data.graph_results?.length || 0} hits</span>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-3 space-y-2">
        {data.merged_results.map((res: any, i: number) => (
          <div key={i} className="bg-[#1e1e21] p-3 rounded-lg border border-zinc-800/50">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-sm text-zinc-200">{res.title}</span>
              <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${res.source === 'rag' ? 'bg-blue-500/10 text-blue-400' : res.source === 'graph' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-fuchsia-500/10 text-fuchsia-400'}`}>
                {res.source} ({(res.score * 100).toFixed(0)}%)
              </span>
            </div>
            {res.path && res.path.length > 0 && (
              <div className="text-[10px] font-mono text-zinc-500 mb-2 flex items-center gap-1 bg-black/20 p-1.5 rounded">
                <span className="text-zinc-400">Path:</span>
                {res.path.map((step: any, j: number) => (
                   <span key={j}> {step.direction==='in'?'←':'→'} <span className="italic text-zinc-600">{step.relation}</span> {step.direction==='in'?'←':'→'} <span className="text-emerald-500/80">{step.node_label}</span></span>
                ))}
              </div>
            )}
            <div className="text-xs text-zinc-400 line-clamp-2">{res.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
