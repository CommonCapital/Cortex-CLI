import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('q');
  
  if (!search) return NextResponse.json([]);
  
  try {
    const notes = await prisma.note.findMany({
      where: { title: { contains: search, mode: 'insensitive' } },
      take: 5
    });
    return NextResponse.json(notes);
  } catch (err) {
    return NextResponse.json([]);
  }
}
