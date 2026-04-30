'use client';

import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const session_id = searchParams.get('session_id') || 'default';
  
  const res = await fetch(`${process.env.FASTAPI_URL || 'http://localhost:8000'}/retrieval/last/${session_id}`);
  
  try {
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ vector_results: [], graph_results: [], merged_results: [] });
  }
}
