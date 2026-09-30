import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((request) => {
  const isLoggedIn = Boolean(request.auth?.user?.email);
  const isLoginPage = request.nextUrl.pathname.startsWith("/login");

  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
