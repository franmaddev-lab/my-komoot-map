const KOMOOT_API = "https://api.komoot.de/v007";
const KOMOOT_WEB = "https://www.komoot.com";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export interface KomootTour {
  id: string;
  name: string;
  sport: string;
  distance: number;
  duration: number;
  date: string;
  path: [number, number][];
  startLat: number;
  startLng: number;
}

export interface KomootUser {
  userId: string;
  email: string;
}

export interface KomootAuth {
  userId: string;
  email: string;
  // We store whichever credential works: Basic token or cookie string
  basicToken?: string;
  cookie?: string;
}

export async function loginToKomoot(
  email: string,
  password: string
): Promise<KomootAuth> {
  // Try web signin first (works for Google-linked accounts with a password added)
  const webRes = await fetch(`${KOMOOT_WEB}/v1/signin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": UA,
    },
    body: JSON.stringify({ email, password }),
    redirect: "follow",
  });

  const webData = await webRes.json().catch(() => null);

  if (webRes.ok && webData && !webData.error) {
    // Extract session cookies from the response
    const rawCookie = webRes.headers.get("set-cookie") ?? "";
    const cookieStr = parseCookies(rawCookie);
    const userId = String(webData.username ?? webData.user_id ?? "");
    if (userId) {
      return { userId, email, cookie: cookieStr };
    }
  }

  // Fall back to Basic Auth (works for native email+password accounts)
  const basicToken = Buffer.from(`${email}:${password}`).toString("base64");
  const basicRes = await fetch(
    `${KOMOOT_API}/account?email=${encodeURIComponent(email)}`,
    {
      headers: {
        Authorization: `Basic ${basicToken}`,
        "Content-Type": "application/json",
        "User-Agent": UA,
      },
    }
  );

  if (!basicRes.ok) {
    const body = await basicRes.text().catch(() => "");
    const webError = webData?.error ?? "unknown";
    throw new Error(
      `Login failed (web: ${webError}, api: ${basicRes.status} ${body.slice(0, 100)})`
    );
  }

  const basicData = await basicRes.json();
  const userId = String(basicData.username ?? basicData.user_id ?? basicData.id ?? "");

  return { userId, email, basicToken };
}

export async function fetchTours(auth: KomootAuth): Promise<KomootTour[]> {
  const headers: Record<string, string> = { "User-Agent": UA };

  if (auth.cookie) {
    headers["Cookie"] = auth.cookie;
  } else if (auth.basicToken) {
    headers["Authorization"] = `Basic ${auth.basicToken}`;
  }

  const res = await fetch(
    `${KOMOOT_API}/users/${auth.userId}/tours/?type=tour_recorded&limit=100`,
    { headers }
  );

  if (!res.ok) {
    // Try web API if the komoot.de API failed
    const webRes = await fetch(
      `${KOMOOT_WEB}/api/v007/users/${auth.userId}/tours/?type=tour_recorded&limit=100`,
      { headers }
    );
    if (!webRes.ok) throw new Error(`Failed to fetch tours: ${res.status}`);
    const webData = await webRes.json();
    return mapTours(webData._embedded?.tours ?? []);
  }

  const data = await res.json();
  return mapTours(data._embedded?.tours ?? []);
}

export async function fetchTourCoordinates(
  tourId: string,
  auth: KomootAuth
): Promise<[number, number][]> {
  const headers: Record<string, string> = { "User-Agent": UA };
  if (auth.cookie) {
    headers["Cookie"] = auth.cookie;
  } else if (auth.basicToken) {
    headers["Authorization"] = `Basic ${auth.basicToken}`;
  }

  const res = await fetch(`${KOMOOT_API}/tours/${tourId}/coordinates`, { headers });
  if (!res.ok) return [];

  const data = await res.json();
  const items: CoordItem[] = data.items ?? [];
  return items.map((c) => [c.lat, c.lng] as [number, number]);
}

function parseCookies(raw: string): string {
  // Extract name=value pairs from Set-Cookie headers (comma-separated)
  const pairs = raw.split(/,(?=[^ ])/);
  return pairs
    .map((p) => p.trim().split(";")[0].trim())
    .filter(Boolean)
    .join("; ");
}

function mapTours(tours: KomootTourRaw[]): KomootTour[] {
  return tours.map((t) => ({
    id: String(t.id),
    name: t.name || "Unnamed tour",
    sport: t.sport || "unknown",
    distance: t.distance || 0,
    duration: t.duration || 0,
    date: t.date || "",
    path: (t._embedded?.coordinates?.items ?? []).map(
      (c) => [c.lat, c.lng] as [number, number]
    ),
    startLat: t.start_point?.lat ?? 0,
    startLng: t.start_point?.lng ?? 0,
  }));
}

interface CoordItem {
  lat: number;
  lng: number;
  alt?: number;
  t?: number;
}

interface KomootTourRaw {
  id: number;
  name: string;
  sport: string;
  distance: number;
  duration: number;
  date: string;
  start_point?: { lat: number; lng: number };
  _embedded?: {
    coordinates?: { items: CoordItem[] };
  };
}
