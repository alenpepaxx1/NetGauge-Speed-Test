import { NextResponse } from 'next/server';

// Create a 1MB buffer of random data once
const BUFFER_SIZE = 1024 * 1024; // 1MB
const buffer = Buffer.alloc(BUFFER_SIZE);
// Fill with random data to prevent compression
for (let i = 0; i < BUFFER_SIZE; i += 1024) {
  buffer[i] = Math.floor(Math.random() * 256);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sizeMB = parseInt(searchParams.get('size') || '10'); // Default 10MB
  const totalBytes = sizeMB * 1024 * 1024;

  let bytesSent = 0;
  
  const stream = new ReadableStream({
    pull(controller) {
      if (bytesSent >= totalBytes) {
        controller.close();
        return;
      }
      const chunkSize = Math.min(BUFFER_SIZE, totalBytes - bytesSent);
      controller.enqueue(new Uint8Array(buffer.buffer, 0, chunkSize));
      bytesSent += chunkSize;
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Content-Length': totalBytes.toString(),
    },
  });
}
