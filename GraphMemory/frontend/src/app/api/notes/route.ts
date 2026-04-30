import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const notes = await prisma.note.findMany({
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, updatedAt: true }
    });
    return NextResponse.json(notes);
  } catch (err) {
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: Request) {
  const { title, content } = await request.json();
  const note = await prisma.note.create({
    data: { title, content }
  });
  
  fetch(`${process.env.FASTAPI_URL || 'http://localhost:8000'}/embed/note`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: note.id, title: note.title, content: note.content })
  }).catch(err => console.error("Failed to trigger embed:", err));

  return NextResponse.json(note);
}
