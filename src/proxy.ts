import createMiddleware from 'next-intl/middleware';
import { routing } from './routing';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware(routing);

export default function middleware(req: NextRequest) {
  // Optional: Add basic auth protection for specific domains
  // const hostname = req.headers.get('host') || '';
  // const protectedDomains = ['staging.example.com'];
  // const isProtected = protectedDomains.some(domain => hostname.includes(domain));
  // 
  // if (isProtected) {
  //   const user = process.env.BASIC_AUTH_USER;
  //   const pass = process.env.BASIC_AUTH_PASS;
  //   const expectedAuth = `Basic ${btoa(`${user}:${pass}`)}`;
  //
  //   const authHeader = req.headers.get('authorization');
  //   if (expectedAuth !== authHeader) {
  //     return new NextResponse('Auth required', {
  //       status: 401,
  //       headers: {
  //         'WWW-Authenticate': 'Basic realm="Restricted Area"',
  //       },
  //     });
  //   }
  // }

  return intlMiddleware(req);
}

export const config = {
  matcher: ['/', '/(de|en)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)']
};