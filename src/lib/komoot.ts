const KOMOOT_API = "https://api.komoot.de/v007";

export interface KomootTour {
  id: string;
  name: string;
  sport: string;
  distance: number;
  duration: number;
  date: string;
  path: [number, number][]; // [lat, lng] pairs
  startLat: number;
  startLng: number;
}

export interface KomootUser {
  userId: string;
  email: string;
}

export async function loginToKomoot(
  email: string,
  password: string
): Promise<KomootUser> {
  const credentials = Buffer.from(`${email}:${password}`).toString("base64");

  const res = await fetch(`${KOMOOT_API}/account`, {
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Invalid credentials");
  }

  const data = await res.json();
  const userId = data.username;

  return { userId, email };
}

export async function fetchTours(
  userId: string,
  token: string
): Promise<KomootTour[]> {
  const res = await fetch(
    `${KOMOOT_API}/users/${userId}/tours/?type=tour_recorded&limit=100`,
    {
      headers: {
        Authorization: `Basic ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch tours");
  }

  const data = await res.json();
  const tours = data._embedded?.tours ?? [];

  return tours.map((t: KomootTourRaw) => ({
    id: String(t.id),
    name: t.name || "Unnamed tour",
    sport: t.sport || "unknown",
    distance: t.distance || 0,
    duration: t.duration || 0,
    date: t.date || "",
    path: decodePath(t._embedded?.coordinates?.items ?? []),
    startLat: t.start_point?.lat ?? 0,
    startLng: t.start_point?.lng ?? 0,
  }));
}

export async function fetchTourCoordinates(
  tourId: string,
  token: string
): Promise<[number, number][]> {
  const res = await fetch(`${KOMOOT_API}/tours/${tourId}/coordinates`, {
    headers: {
      Authorization: `Basic ${token}`,
    },
  });

  if (!res.ok) return [];

  const data = await res.json();
  const items: CoordItem[] = data.items ?? [];
  return items.map((c) => [c.lat, c.lng] as [number, number]);
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

function decodePath(items: CoordItem[]): [number, number][] {
  return items.map((c) => [c.lat, c.lng]);
}
