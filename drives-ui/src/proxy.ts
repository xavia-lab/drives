import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const API_URL =
  process.env.DRIVES_FRONTEND_API_URL || "http://localhost:5000/api/v1";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Lightweight Docker Health check
  if (pathname === "/api/health") {
    return NextResponse.json(
      { status: "ok", timestamp: new Date().toISOString() },
      { status: 200 },
    );
  }

  // 2. Only intercept our proxy path
  if (pathname.startsWith("/api/proxy")) {
    console.log(`API request for ${pathname}${request.nextUrl.search}`);

    // 1. Clean the base and the incoming path
    const backendBase = API_URL.replace(/\/+$/, "");
    const remainingPath = pathname.replace(/^\/api\/proxy/, "");

    // 2. Build the absolute target URL (prevents "Invalid URL" error)
    const targetUrl = new URL(
      `${backendBase}${remainingPath}${request.nextUrl.search}`,
    );

    console.log(`API Redirecting ${pathname} to: ${targetUrl}`);

    // 3. Proxy ALL headers from the source request
    // This includes Authorization, Cookie, Content-Type, etc.
    const requestHeaders = new Headers(request.headers);

    // Important: Most proxies need the 'host' header to match the destination
    // requestHeaders.set("host", targetUrl.host);

    // 4. Return the rewrite with the cloned headers
    return NextResponse.rewrite(targetUrl, {
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/proxy/:path*", "/api/health"],
};
