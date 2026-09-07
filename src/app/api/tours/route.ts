import { NextResponse } from "next/server";
import { fetchTours, fetchTourCoordinates } from "@/lib/komoot";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();

  if (!session.userId || !session.token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tours = await fetchTours(session.userId, session.token);

    // Fetch coordinates for tours that don't have embedded path data
    const toursWithPaths = await Promise.all(
      tours.map(async (tour) => {
        if (tour.path.length === 0 && tour.id) {
          tour.path = await fetchTourCoordinates(tour.id, session.token!);
        }
        return tour;
      })
    );

    return NextResponse.json({ tours: toursWithPaths });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch tours" },
      { status: 500 }
    );
  }
}
