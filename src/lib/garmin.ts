import { GarminConnect } from "garmin-connect";
import type { KomootTour } from "@/lib/komoot";

export interface GarminSession {
  tokenJson: string;
}

async function makeClient() {
  return new GarminConnect({ username: "", password: "" });
}

export async function loginToGarmin(
  email: string,
  password: string
): Promise<GarminSession> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 1500 * attempt));
    try {
      const client = new GarminConnect({ username: email, password });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (client as any).login(email, password);
      const tokenJson = JSON.stringify(client.exportToken());
      return { tokenJson };
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

async function restoreClient(tokenJson: string): Promise<GarminConnect> {
  const client = new GarminConnect({ username: "", password: "" });
  const { oauth1, oauth2 } = JSON.parse(tokenJson);
  client.loadToken(oauth1, oauth2);
  return client;
}

export async function fetchGarminActivities(
  session: GarminSession
): Promise<KomootTour[]> {
  const client = await restoreClient(session.tokenJson);
  // Fetch up to 200 most recent activities
  const raw = await client.getActivities(0, 200);
  const activities = raw as GarminActivity[];

  return activities.map((a) => ({
    id: String(a.activityId),
    name: a.activityName || "Unnamed activity",
    sport: mapSport(a.activityType?.typeKey ?? ""),
    distance: a.distance || 0,
    duration: a.duration || 0,
    date: a.startTimeLocal || "",
    path: [], // fetched on-demand when user selects an activity
    startLat: a.startLatitude ?? 0,
    startLng: a.startLongitude ?? 0,
  }));
}

export async function fetchGarminActivityRoute(
  activityId: string,
  session: GarminSession
): Promise<[number, number][]> {
  const client = await restoreClient(session.tokenJson);

  // Download the GPX and parse the track points
  // downloadOriginalActivityData(activity, dir?, type?)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gpxBuffer: Buffer = await (client as any).downloadOriginalActivityData(
    { activityId: Number(activityId) },
    undefined,
    "gpx"
  );

  if (!gpxBuffer) return [];
  const gpx = Buffer.isBuffer(gpxBuffer) ? gpxBuffer.toString() : String(gpxBuffer);
  return parseGpxTrack(gpx);
}

function parseGpxTrack(gpx: string): [number, number][] {
  const points: [number, number][] = [];
  const trkptRe = /<trkpt\s+lat="([^"]+)"\s+lon="([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = trkptRe.exec(gpx)) !== null) {
    points.push([parseFloat(m[1]), parseFloat(m[2])]);
  }
  // Downsample if too many points (keep every Nth for performance)
  if (points.length > 500) {
    const step = Math.ceil(points.length / 500);
    return points.filter((_, i) => i % step === 0);
  }
  return points;
}

function mapSport(typeKey: string): string {
  const map: Record<string, string> = {
    running: "run",
    trail_running: "run",
    cycling: "bike",
    mountain_biking: "mtb",
    road_biking: "bike",
    gravel_cycling: "bike",
    hiking: "hike",
    walking: "hike",
    skiing: "ski",
    backcountry_skiing: "ski",
    snowboarding: "ski",
    snowshoeing: "snowshoe",
  };
  return map[typeKey] ?? "unknown";
}

interface GarminActivity {
  activityId: number;
  activityName: string;
  activityType: { typeKey: string };
  distance: number;
  duration: number;
  startTimeLocal: string;
  startLatitude: number | null;
  startLongitude: number | null;
}
