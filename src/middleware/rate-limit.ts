// Simple rate limiting middleware for Next.js API routes
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const RATE_LIMIT = 100; // requests per 15 minutes
const WINDOW_MS = 15 * 60 * 1000;
const ipMap = new Map<string, { count: number; start: number }>();

export function middleware(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();
  const entry = ipMap.get(ip) || { count: 0, start: now };
  if (now - entry.start > WINDOW_MS) {
    entry.count = 1;
    entry.start = now;
  } else {
    entry.count += 1;
  }
  ipMap.set(ip, entry);
  if (entry.count > RATE_LIMIT) {
    return new NextResponse('Rate limit exceeded', { status: 429 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
