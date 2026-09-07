import { NextResponse } from "next/server";
import { fetchTours, fetchTourCoordinates, KomootAuth } from "@/lib/komoot";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const auth: KomootAuth = {
    userId: session.userId,
    email: session.email ?? "",
    basicToken: session.basicToken,
    cookie: session.cookie,
  };

  try {
    const tours = await fetchTours(auth);

    const toursWithPaths = await Promise.all(
      tours.map(async (tour) => {
        if (tour.path.length === 0 && tour.id) {
          tour.path = await fetchTourCoordinates(tour.id, auth);
        }
        return tour;
      })
    );

    return NextResponse.json({ tours: toursWithPaths });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch tours";
    console.error("[tours]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
