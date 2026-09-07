"use client";

import { useEffect, useRef } from "react";
import type { KomootTour } from "@/lib/komoot";
import "leaflet/dist/leaflet.css";

interface Props {
  tours: KomootTour[];
  selected: KomootTour | null;
  onSelect: (tour: KomootTour) => void;
}

export default function TourMap({ tours, selected, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const polylinesRef = useRef<Map<string, import("leaflet").Polyline>>(new Map());

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Dynamic import to avoid SSR issues
    import("leaflet").then((L) => {
      // Fix default marker icons
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current!).setView([46, 14], 5);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      // Draw all tours
      tours.forEach((tour) => {
        if (tour.path.length < 2) return;

        const line = L.polyline(tour.path, {
          color: "#059669",
          weight: 3,
          opacity: 0.6,
        }).addTo(map);

        line.on("click", () => onSelect(tour));
        line.bindTooltip(tour.name, { sticky: true });
        polylinesRef.current.set(tour.id, line);
      });

      // Fit map to all tours
      const allPoints = tours.flatMap((t) => t.path);
      if (allPoints.length > 0) {
        map.fitBounds(L.latLngBounds(allPoints), { padding: [40, 40] });
      }
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      polylinesRef.current.clear();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tours]);

  // Highlight selected tour
  useEffect(() => {
    import("leaflet").then((L) => {
      polylinesRef.current.forEach((line, id) => {
        if (id === selected?.id) {
          line.setStyle({ color: "#dc2626", weight: 5, opacity: 1 });
          line.bringToFront();
          if (selected.path.length > 1) {
            mapRef.current?.fitBounds(L.latLngBounds(selected.path), {
              padding: [60, 60],
            });
          }
        } else {
          line.setStyle({ color: "#059669", weight: 3, opacity: 0.6 });
        }
      });
    });
  }, [selected]);

  return <div ref={containerRef} className="w-full h-full" />;
}
