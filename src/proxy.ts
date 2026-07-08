import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Single-container HTTP Basic Auth gate, equivalent to the existing app's
// `express-basic-auth` wrapping every route (including the API routes the
// client fetches for live session data - the matcher below must not exclude /api).
export function proxy(request: NextRequest) {
  // Dev-only escape hatch for browser automation: embedding credentials in the page
  // URL to satisfy the native Basic Auth prompt makes the browser refuse to run any
  // fetch() at all ("Request cannot be constructed from a URL that includes
  // credentials"), so headless testing needs a way in without a credentialed URL.
  // Never active in production (NODE_ENV is always 'production' there).
  if (process.env.NODE_ENV !== 'production' && process.env.E2E_BYPASS_AUTH === '1') {
    return NextResponse.next();
  }

  const user = process.env.APP_USER;
  const pass = process.env.APP_PASSWORD;
  const auth = request.headers.get('authorization');
  const expected = user && pass ? 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64') : null;

  if (!expected || auth !== expected) {
    return new NextResponse('Authentication required.', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Workout Tracker"' },
    });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
