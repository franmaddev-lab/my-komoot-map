import { NextRequest, NextResponse } from "next/server";
import { exchangeStravaCode } from "@/lib/strava";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(`${origin}/?error=strava_denied`);
  }

  try {
    const tokens = await exchangeStravaCode(code);
    const session = await getSession();
    session.provider = "strava";
    session.userId = String(tokens.athleteId);
    session.displayName = tokens.athleteName;
    session.stravaAccessToken = tokens.accessToken;
    session.stravaRefreshToken = tokens.refreshToken;
    session.stravaExpiresAt = tokens.expiresAt;
    await session.save();
    return NextResponse.redirect(`${origin}/map`);
  } catch (err) {
    console.error("[strava callback]", err);
    return NextResponse.redirect(`${origin}/?error=strava_failed`);
  }
}
