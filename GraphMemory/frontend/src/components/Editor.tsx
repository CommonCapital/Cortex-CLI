'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useState, useCallback, useRef } from 'react';
import useSWR from 'swr';

export default function Editor({ noteId }: { noteId: string }) {
  const [title, setTitle] = useState('');
  
  const { data: note } = useSWR(noteId ? `/api/notes/${noteId}` : null, (url) => fetch(url).then(r => r.json()));
  
  const saveNote = useCallback(async (content: string, newTitle: string) => {
    if (!noteId) return;
    await fetch(`/api/notes/${noteId}`, {
      method: 'PATCH',
      body: JSON.stringify({ title: newTitle, content })
    });
  }, [noteId]);

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-p:text-zinc-300 prose-headings:text-zinc-100 focus:outline-none max-w-none w-full min-h-[500px]',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // simplified debounce for this snippet
      saveNote(html, title);
    },
  });

  useEffect(() => {
    if (note && editor && editor.getHTML() !== note.content) {
      editor.commands.setContent(note.content || '');
      setTitle(note.title || '');
    }
  }, [note, editor]);

  if (!noteId) return null;

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-300 max-w-3xl mx-auto w-full">
      <input
        type="text"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          const html = editor?.getHTML() || '';
          saveNote(html, e.target.value);
        }}
        className="text-4xl font-bold bg-transparent border-none outline-none text-zinc-100 placeholder:text-zinc-700 tracking-tight"
        placeholder="Untitled Note"
      />
      <div className="flex-1 mt-6 bg-[#161618]/30 p-8 rounded-2xl border border-zinc-800/40 shadow-inner">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
