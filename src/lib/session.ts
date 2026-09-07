import { getIronSession, IronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  userId?: string;
  email?: string;
  token?: string; // base64-encoded "email:password" for Komoot basic auth
}

const sessionOptions: SessionOptions = {
  password:
    process.env.SESSION_SECRET ||
    "complex-password-at-least-32-characters-long-here",
  cookieName: "komoot-map-session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}
