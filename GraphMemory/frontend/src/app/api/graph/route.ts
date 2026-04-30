import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const min_confidence = searchParams.get('min_confidence') || '0.0';
  
  let endpoint = `${process.env.FASTAPI_URL || 'http://localhost:8000'}/graph/subgraph?min_confidence=${min_confidence}`;
  
  try {
    const res = await fetch(endpoint);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ nodes: [], edges: [] });
  }
}
