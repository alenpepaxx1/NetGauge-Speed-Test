import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const reader = request.body?.getReader();
  let received = 0;

  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.length;
    }
  }

  return NextResponse.json({ 
    received,
    timestamp: Date.now() 
  });
}
