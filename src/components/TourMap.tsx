"use client";

import { useEffect, useRef } from "react";
import type { KomootTour } from "@/lib/komoot";
import "leaflet/dist/leaflet.css";

interface Props {
  tours: KomootTour[];
  selected: KomootTour | null;
  onSelect: (tour: KomootTour) => void;
  onLoadRoute?: (tour: KomootTour) => void; // called when a route needs fetching
}

export default function TourMap({ tours, selected, onSelect, onLoadRoute }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const polylinesRef = useRef<Map<string, import("leaflet").Polyline>>(new Map());
  const markersRef = useRef<Map<string, import("leaflet").CircleMarker>>(new Map());

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    import("leaflet").then((L) => {
      const map = L.map(containerRef.current!).setView([46, 14], 5);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      const allPoints: [number, number][] = [];

      tours.forEach((tour) => {
        if (tour.path.length >= 2) {
          // Draw full route
          const line = L.polyline(tour.path, {
            color: "#059669",
            weight: 3,
            opacity: 0.6,
          }).addTo(map);
          line.on("click", () => onSelect(tour));
          line.bindTooltip(tour.name, { sticky: true });
          polylinesRef.current.set(tour.id, line);
          allPoints.push(...tour.path);
        } else if (tour.startLat && tour.startLng) {
          // Show start point marker only (route loads on click)
          const marker = L.circleMarker([tour.startLat, tour.startLng], {
            radius: 5,
            color: "#059669",
            fillColor: "#059669",
            fillOpacity: 0.7,
            weight: 1,
          }).addTo(map);
          marker.on("click", () => {
            onSelect(tour);
            onLoadRoute?.(tour);
          });
          marker.bindTooltip(tour.name, { sticky: true });
          markersRef.current.set(tour.id, marker);
          allPoints.push([tour.startLat, tour.startLng]);
        }
      });

      if (allPoints.length > 0) {
        map.fitBounds(L.latLngBounds(allPoints), { padding: [40, 40] });
      }
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      polylinesRef.current.clear();
      markersRef.current.clear();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tours]);

  // When a tour gets a route loaded, upgrade its marker to a polyline
  useEffect(() => {
    import("leaflet").then((L) => {
      tours.forEach((tour) => {
        if (tour.path.length >= 2 && markersRef.current.has(tour.id)) {
          const marker = markersRef.current.get(tour.id)!;
          mapRef.current?.removeLayer(marker);
          markersRef.current.delete(tour.id);

          const line = L.polyline(tour.path, {
            color: selected?.id === tour.id ? "#dc2626" : "#059669",
            weight: selected?.id === tour.id ? 5 : 3,
            opacity: selected?.id === tour.id ? 1 : 0.6,
          }).addTo(mapRef.current!);
          line.on("click", () => onSelect(tour));
          line.bindTooltip(tour.name, { sticky: true });
          polylinesRef.current.set(tour.id, line);

          if (selected?.id === tour.id) {
            mapRef.current?.fitBounds(L.latLngBounds(tour.path), { padding: [60, 60] });
          }
        }
      });
    });
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
            mapRef.current?.fitBounds(L.latLngBounds(selected.path), { padding: [60, 60] });
          }
        } else {
          line.setStyle({ color: "#059669", weight: 3, opacity: 0.6 });
        }
      });

      // Highlight marker if no route yet
      markersRef.current.forEach((marker, id) => {
        marker.setStyle({
          color: id === selected?.id ? "#dc2626" : "#059669",
          fillColor: id === selected?.id ? "#dc2626" : "#059669",
          radius: id === selected?.id ? 8 : 5,
        });
        if (id === selected?.id) {
          const tour = tours.find((t) => t.id === id);
          if (tour?.startLat && tour.startLng) {
            mapRef.current?.setView([tour.startLat, tour.startLng], 13);
          }
        }
      });
    });
  }, [selected, tours]);

  return <div ref={containerRef} className="w-full h-full" />;
}
