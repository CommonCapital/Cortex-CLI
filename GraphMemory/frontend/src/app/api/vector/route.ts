'use client';

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  const res = await fetch(`${process.env.FASTAPI_URL || 'http://localhost:8000'}/vector/project`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  
  try {
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json([]);
  }
}
