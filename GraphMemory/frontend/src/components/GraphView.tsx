'use client';
import { useMemo, useState } from 'react';
import ReactFlow, { Background, Controls, MiniMap, MarkerType, Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const CATEGORY_COLORS: Record<string, string> = {
  structural: '#9ca3af', // gray
  causal: '#fbbf24', // amber
  social: '#2dd4bf', // teal
  temporal: '#60a5fa', // blue
  similarity: '#c084fc', // purple
  hierarchy: '#fb7185', // coral
  default: '#71717a'
};

const RELATION_CATEGORIES: Record<string, string> = {
  is_a: 'structural', part_of: 'structural', type_of: 'structural', instance_of: 'structural',
  causes: 'causal', enables: 'causal', requires: 'causal', contradicts: 'causal', supports: 'causal',
  works_at: 'social', created_by: 'social', knows: 'social', founded: 'social', reports_to: 'social',
  precedes: 'temporal', succeeded_by: 'temporal', happened_before: 'temporal',
  similar_to: 'similarity', synonym_of: 'similarity', antonym_of: 'similarity',
  broader_than: 'hierarchy', narrower_than: 'hierarchy', subclass_of: 'hierarchy'
};

export default function GraphView() {
  const [showLegend, setShowLegend] = useState(false);
  const [minConf, setMinConf] = useState(0.0);
  const [minWeight, setMinWeight] = useState(0.0);
  
  const { data } = useSWR(`/api/graph?min_confidence=${minConf}`, fetcher);
  
  const nodes = useMemo(() => {
    if (!data?.nodes) return [];
    return data.nodes.map((n: any) => ({
      ...n,
      position: { x: Math.random() * 800 - 400, y: Math.random() * 800 - 400 },
      style: { background: '#1e1e21', color: '#fff', border: '1px solid #3f3f46', borderRadius: '8px', padding: '10px' }
    }));
  }, [data?.nodes]);

  const edges = useMemo(() => {
    if (!data?.edges) return [];
    return data.edges
      .filter((e: any) => (e.data?.weight || 1.0) >= minWeight)
      .map((e: any) => {
      const rel = e.label || 'related_to';
      const cat = RELATION_CATEGORIES[rel] || 'default';
      const color = CATEGORY_COLORS[cat];
      const weight = e.data?.weight || 1.0;
      const conf = e.data?.confidence || 1.0;
      const dir = e.data?.direction || 'out';
      
      const opacity = conf < 0.6 ? 0.3 : 0.8;
      
      let markerEnd, markerStart;
      if (dir === 'out' || dir === 'bidirectional') {
        markerEnd = { type: MarkerType.ArrowClosed, color };
      }
      if (dir === 'in' || dir === 'bidirectional') {
        markerStart = { type: MarkerType.ArrowClosed, color };
      }

      let strokeDasharray = 'none';
      if (rel === 'similar_to') strokeDasharray = '2 2';
      if (e.data?.extractedBy === 'wikilink') strokeDasharray = '5 5';

      return {
        id: e.id,
        source: e.source,
        target: e.target,
        label: rel,
        labelStyle: { fill: color, fontWeight: 700, fontSize: 10 },
        labelBgStyle: { fill: '#121214', fillOpacity: 0.8 },
        style: {
          strokeWidth: Math.max(1, weight * 3),
          stroke: color,
          opacity,
          strokeDasharray
        },
        markerEnd,
        markerStart,
        data: e.data
      } as Edge;
    });
  }, [data?.edges, minWeight]);

  if (!data) return <div className="h-full flex items-center justify-center text-white">Loading Graph...</div>;

  return (
    <div className="w-full h-full text-white pt-16 relative">
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background color="#555" gap={20} />
        <Controls className="bg-zinc-800 border-zinc-700 fill-white" />
        <MiniMap nodeStrokeColor="#555" nodeColor="#222" maskColor="rgba(0,0,0,0.7)" />
      </ReactFlow>

      {/* Legend Toggle */}
      <button 
        onClick={() => setShowLegend(!showLegend)} 
        className="absolute top-24 left-6 z-50 bg-zinc-800/80 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider hover:bg-zinc-700 transition-colors"
      >
        {showLegend ? 'Hide Legend' : 'Show Legend'}
      </button>

      {/* Legend & Filters */}
      {showLegend && (
        <div className="absolute top-36 left-6 z-50 bg-[#161618]/90 backdrop-blur-md p-4 rounded-xl border border-zinc-700/50 shadow-2xl w-64">
          <h3 className="text-xs font-bold text-zinc-400 mb-3 uppercase tracking-wider">Relation Categories</h3>
          <div className="space-y-2 mb-6">
            {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
              <div key={cat} className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></span>
                <span className="capitalize">{cat}</span>
              </div>
            ))}
          </div>

          <h3 className="text-xs font-bold text-zinc-400 mb-3 uppercase tracking-wider">Filters</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-zinc-300 flex justify-between">
                <span>Min Confidence</span>
                <span className="font-mono">{minConf.toFixed(2)}</span>
              </label>
              <input type="range" min="0" max="1" step="0.05" value={minConf} onChange={e => setMinConf(parseFloat(e.target.value))} className="w-full accent-purple-500 mt-1" />
            </div>
            <div>
              <label className="text-xs text-zinc-300 flex justify-between">
                <span>Min Weight</span>
                <span className="font-mono">{minWeight.toFixed(2)}</span>
              </label>
              <input type="range" min="0" max="1" step="0.05" value={minWeight} onChange={e => setMinWeight(parseFloat(e.target.value))} className="w-full accent-purple-500 mt-1" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
