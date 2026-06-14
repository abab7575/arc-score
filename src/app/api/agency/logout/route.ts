import { NextResponse } from "next/server";
import { AGENCY_SESSION_COOKIE_NAME } from "@/lib/auth";
import { publicUrl } from "@/lib/public-url";

export async function POST() {
  const response = NextResponse.redirect(publicUrl("/agency/login"), 303);
  response.cookies.delete(AGENCY_SESSION_COOKIE_NAME);
  return response;
}
