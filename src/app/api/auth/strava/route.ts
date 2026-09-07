import { NextResponse } from "next/server";
import { getStravaAuthUrl } from "@/lib/strava";

export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  const url = getStravaAuthUrl(`${origin}/api/auth/strava/callback`);
  return NextResponse.redirect(url);
}
