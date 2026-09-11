import { NextRequest, NextResponse } from "next/server";
import { loginToGarmin } from "@/lib/garmin";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    const garminSession = await loginToGarmin(email, password);

    const session = await getSession();
    session.provider = "garmin";
    session.userId = email;
    session.email = email;
    session.garminTokenJson = garminSession.tokenJson;
    await session.save();

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Login failed";
    console.error("[garmin auth]", msg);
    return NextResponse.json(
      { error: "Login failed — check your Garmin Connect email and password" },
      { status: 401 }
    );
  }
}
