import { NextRequest, NextResponse } from "next/server";
import { fetchGarminActivityRoute } from "@/lib/garmin";
import { getSession } from "@/lib/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (session.provider === "garmin" && session.garminTokenJson) {
    try {
      const path = await fetchGarminActivityRoute(id, {
        tokenJson: session.garminTokenJson,
      });
      return NextResponse.json({ path });
    } catch (err) {
      console.error("[garmin route]", err);
      return NextResponse.json({ path: [] });
    }
  }

  return NextResponse.json({ path: [] });
}
