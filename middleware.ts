import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === "/ar" || pathname.startsWith("/ar/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/^\/ar/, "") || "/";
    url.search = search;
    return NextResponse.redirect(url, 308);
  }

  if (pathname === "/privacy" || pathname === "/en/privacy") {
    const url = request.nextUrl.clone();
    url.pathname = pathname === "/en/privacy" ? "/en/privacy-policy" : "/privacy-policy";
    return NextResponse.redirect(url, 308);
  }

  if (pathname === "/insights" || pathname.startsWith("/insights/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/^\/insights/, "/ruaa");
    url.search = search;
    return NextResponse.redirect(url, 308);
  }

  if (pathname === "/en/insights" || pathname.startsWith("/en/insights/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/^\/en\/insights/, "/en/ruaa");
    url.search = search;
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/ar/:path*", "/insights/:path*", "/en/insights/:path*"]
};
