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

  // 3. Intercept paths starting with /qrl/
  if (pathname.startsWith("/qrl/")) {
    const shortId = pathname.split("/").pop();

    if (!shortId) return NextResponse.next();

    console.log(`Resolving shortId: ${shortId}`);

    try {
      // Call backend API server URL
      const qrUrl = `${API_URL}/qr-resolver/${shortId}`;
      console.log(`Redirecting to: ${qrUrl}`);
      const response = await fetch(`${qrUrl}`, {
        headers: { "Content-Type": "application/json" },
        next: { revalidate: 60 }, // Optional: cache the resolution for 1 minute
      });

      if (response.ok) {
        const data = await response.json();

        console.log(`Got backend resolution: ${JSON.stringify(data)}`);

        // data.targetUri would be something like "/products/G0jv9cFRj5a7QOroeqwUM"
        return NextResponse.redirect(new URL(data.targetUri, request.url));
      }
    } catch (error) {
      console.error("QR Resolution failed:", error);
    }

    // If ID not found or backend fails, show 404
    return NextResponse.rewrite(new URL("/404", request.url));
  }

  return NextResponse.next();
}

// 4. Update Matcher to include both QR routes and Health check
export const config = {
  matcher: ["/qrl/:path*", "/api/proxy/:path*", "/api/health"],
};
