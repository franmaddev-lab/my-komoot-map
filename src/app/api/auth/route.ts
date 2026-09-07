import { NextRequest, NextResponse } from "next/server";
import { loginToKomoot } from "@/lib/komoot";
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

    const user = await loginToKomoot(email, password);
    const token = Buffer.from(`${email}:${password}`).toString("base64");

    const session = await getSession();
    session.userId = user.userId;
    session.email = user.email;
    session.token = token;
    await session.save();

    return NextResponse.json({ ok: true, userId: user.userId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Login failed";
    console.error("[auth]", msg);
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}

export async function DELETE() {
  const session = await getSession();
  session.destroy();
  return NextResponse.json({ ok: true });
}
