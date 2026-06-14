import { NextResponse } from "next/server";
import { AGENCY_SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/agency/login", request.url), 303);
  response.cookies.delete(AGENCY_SESSION_COOKIE_NAME);
  return response;
}
