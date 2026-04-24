import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const GATE_COOKIE = 'fotomatic_photo_gate';

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/photo-admin/setup')) {
    if (request.cookies.get(GATE_COOKIE)?.value !== '1') {
      return NextResponse.redirect(new URL('/photo-admin', request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/photo-admin/setup'],
};
