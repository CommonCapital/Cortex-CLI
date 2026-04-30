import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const note = await prisma.note.findUnique({
    where: { id: params.id }
  });
  return NextResponse.json(note);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { title, content } = await request.json();
  const note = await prisma.note.update({
    where: { id: params.id },
    data: { title, content }
  });

  fetch(`${process.env.FASTAPI_URL || 'http://localhost:8000'}/embed/note`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: note.id, title: note.title, content: note.content })
  }).catch(err => console.error("Failed to trigger embed:", err));

  return NextResponse.json(note);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  await prisma.note.delete({
    where: { id: params.id }
  });
  return NextResponse.json({ success: true });
}
