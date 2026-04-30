import { NextResponse } from 'next/server';

export async function POST() {
  const res = await fetch(`${process.env.FASTAPI_URL || 'http://localhost:8000'}/graph/reextract-all`, { method: 'POST' });
  try {
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ status: "started" });
  }
}
