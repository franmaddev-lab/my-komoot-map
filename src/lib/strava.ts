import polyline from "@mapbox/polyline";

const STRAVA_API = "https://www.strava.com/api/v3";

export interface StravaTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  athleteId: number;
  athleteName: string;
}

export function getStravaAuthUrl(callbackUrl: string): string {
  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID!,
    redirect_uri: callbackUrl,
    response_type: "code",
    scope: "read,activity:read_all",
  });
  return `https://www.strava.com/oauth/authorize?${params}`;
}

export async function exchangeStravaCode(code: string): Promise<StravaTokens> {
  const res = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Strava token exchange failed: ${err}`);
  }

  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_at,
    athleteId: data.athlete.id,
    athleteName: `${data.athlete.firstname} ${data.athlete.lastname}`.trim(),
  };
}

export async function fetchStravaActivities(
  accessToken: string
): Promise<import("@/lib/komoot").KomootTour[]> {
  const activities: StravaActivity[] = [];
  let page = 1;

  while (true) {
    const res = await fetch(
      `${STRAVA_API}/athlete/activities?per_page=100&page=${page}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!res.ok) break;
    const batch: StravaActivity[] = await res.json();
    if (batch.length === 0) break;
    activities.push(...batch);
    if (batch.length < 100) break;
    page++;
  }

  return activities
    .filter((a) => a.map?.summary_polyline)
    .map((a) => ({
      id: String(a.id),
      name: a.name || "Unnamed activity",
      sport: mapSport(a.type),
      distance: a.distance || 0,
      duration: a.moving_time || 0,
      date: a.start_date || "",
      path: polyline.decode(a.map.summary_polyline) as [number, number][],
      startLat: a.start_latlng?.[0] ?? 0,
      startLng: a.start_latlng?.[1] ?? 0,
    }));
}

function mapSport(type: string): string {
  const map: Record<string, string> = {
    Run: "run",
    Ride: "bike",
    EBikeRide: "e_bike",
    Hike: "hike",
    Walk: "hike",
    AlpineSki: "ski",
    NordicSki: "ski",
    Snowshoe: "snowshoe",
    VirtualRide: "bike",
    VirtualRun: "run",
  };
  return map[type] ?? "unknown";
}

interface StravaActivity {
  id: number;
  name: string;
  type: string;
  distance: number;
  moving_time: number;
  start_date: string;
  start_latlng: [number, number] | null;
  map: { summary_polyline: string };
}
