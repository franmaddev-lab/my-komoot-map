"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { KomootTour } from "@/lib/komoot";

const TourMap = dynamic(() => import("@/components/TourMap"), { ssr: false });

export default function MapPage() {
  const router = useRouter();
  const [tours, setTours] = useState<KomootTour[]>([]);
  const [selected, setSelected] = useState<KomootTour | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadingRoute, setLoadingRoute] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/tours");
      if (res.status === 401) {
        router.push("/");
        return;
      }
      if (!res.ok) {
        setError("Failed to load tours");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setTours(data.tours);
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleLoadRoute(tour: KomootTour) {
    if (tour.path.length > 0 || loadingRoute === tour.id) return;
    setLoadingRoute(tour.id);
    try {
      const res = await fetch(`/api/tours/${tour.id}`);
      if (!res.ok) return;
      const { path } = await res.json();
      if (path?.length > 0) {
        setTours((prev) =>
          prev.map((t) => (t.id === tour.id ? { ...t, path } : t))
        );
      }
    } finally {
      setLoadingRoute(null);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/");
  }

  const sportEmoji: Record<string, string> = {
    hike: "🥾",
    bike: "🚵",
    e_bike: "⚡",
    racebike: "🚴",
    mtb: "🚵",
    run: "🏃",
    ski: "⛷️",
    snowshoe: "❄️",
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-72 flex flex-col bg-white shadow-md z-10 overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg text-gray-900">My Komoot Map</h1>
            <p className="text-xs text-gray-500">{tours.length} tours</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            Log out
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
              Loading your tours…
            </div>
          )}
          {error && (
            <div className="p-4 text-red-500 text-sm">{error}</div>
          )}
          {!loading && !error && tours.length === 0 && (
            <div className="p-4 text-gray-400 text-sm">No recorded tours found.</div>
          )}
          {tours.map((tour) => (
            <button
              key={tour.id}
              onClick={() => { setSelected(tour); handleLoadRoute(tour); }}
              className={`w-full text-left px-4 py-3 border-b hover:bg-emerald-50 transition-colors ${
                selected?.id === tour.id ? "bg-emerald-50 border-l-4 border-l-emerald-500" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {sportEmoji[tour.sport] ?? "🗺️"}
                </span>
                <div className="min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">
                    {tour.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {tour.date ? new Date(tour.date).toLocaleDateString() : "—"}{" "}
                    · {(tour.distance / 1000).toFixed(1)} km
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Map */}
      <main className="flex-1 relative">
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-3">🗺️</div>
              <p>Fetching your adventures…</p>
            </div>
          </div>
        ) : (
          <>
            <TourMap tours={tours} selected={selected} onSelect={(t) => { setSelected(t); handleLoadRoute(t); }} onLoadRoute={handleLoadRoute} />
            {loadingRoute && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full">
                Loading route…
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
