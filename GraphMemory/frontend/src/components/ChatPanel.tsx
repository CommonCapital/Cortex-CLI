'use client';
import { useState } from 'react';

export default function ChatPanel({ activeNoteId }: { activeNoteId: string | null }) {
  const [messages, setMessages] = useState<{role: string, content: string, sources?: any[]}[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMsg, session_id: 'default', top_k: 5 })
      });

      if (!res.body) throw new Error("No body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      
      let aiMsg = '';
      let sources: any[] = [];
      
      setMessages(prev => [...prev, { role: 'ai', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'sources') {
              sources = data.data;
              setMessages(prev => {
                const newArr = [...prev];
                newArr[newArr.length - 1].sources = sources;
                return newArr;
              });
            } else if (data.type === 'chunk') {
              aiMsg += data.data;
              setMessages(prev => {
                const newArr = [...prev];
                newArr[newArr.length - 1].content = aiMsg;
                return newArr;
              });
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#121214]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center flex flex-col items-center text-zinc-500 text-sm mt-10">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            Ask MemoryOS anything about your knowledge base.
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2`}>
            <div className={`p-3 rounded-2xl max-w-[90%] text-sm leading-relaxed ${msg.role === 'user' ? 'bg-purple-600 text-white rounded-br-sm shadow-lg shadow-purple-500/20' : 'bg-[#1e1e21] text-zinc-200 rounded-bl-sm shadow-md border border-zinc-800/50'}`}>
              {msg.content}
            </div>
            {msg.sources && msg.sources.length > 0 && (
              <div className="flex flex-col gap-1.5 mt-2">
                {msg.sources.map((src, i) => (
                  <div key={i} className="flex flex-col">
                    <span className={`w-fit text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${src.source === 'rag' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : src.source === 'graph' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20'}`}>
                      {src.source === 'rag' ? 'Vector' : src.source === 'graph' ? 'Graph' : 'Hybrid'} Hit
                    </span>
                    {src.path && src.path.length > 0 && (
                      <div className="text-[9px] text-zinc-500 flex items-center gap-1 mt-1 font-mono flex-wrap bg-black/20 p-1.5 rounded-md">
                        <span className="text-zinc-400 font-semibold">Query</span>
                        {src.path.map((step: any, j: number) => (
                          <span key={j} className="flex items-center gap-1">
                            <span>{step.direction === 'in' ? '←' : '→'}</span>
                            <span className="text-zinc-500 italic">{step.relation}</span>
                            <span>{step.direction === 'in' ? '←' : '→'}</span>
                            <span className="text-emerald-400/80">{step.node_label}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-zinc-800/60 bg-[#161618]">
        <form onSubmit={sendMessage} className="relative">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about your knowledge..."
            className="w-full bg-zinc-900 border border-zinc-700/50 rounded-full pl-4 pr-10 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all shadow-inner"
          />
          <button type="submit" disabled={isLoading} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-purple-400 hover:text-purple-300 disabled:opacity-50 transition-colors bg-purple-500/10 rounded-full hover:bg-purple-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </form>
      </div>
    </div>
  );
}
