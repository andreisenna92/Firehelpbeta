import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { useEffect } from "react";
import { SAQUAREMA_CENTER, statusColor, type FireStatus } from "@/lib/firehelp";

export type MapPoint = {
  id: string;
  latitude: number;
  longitude: number;
  status: FireStatus;
};

export type FireMapProps = {
  points?: MapPoint[];
  center?: [number, number];
  zoom?: number;
  picked?: { lat: number; lng: number } | null;
  onPick?: (coords: { lat: number; lng: number }) => void;
  renderPopup?: (id: string) => React.ReactNode;
};

function pinIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:20px;height:20px;border-radius:9999px;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(15,23,42,.45)"></span>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

function ClickHandler({ onPick }: { onPick: (coords: { lat: number; lng: number }) => void }) {
  useMapEvents({
    click(event) {
      onPick({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });
  return null;
}

function Recenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center[0], center[1], zoom]);
  return null;
}

export default function FireMapImpl({
  points = [],
  center = SAQUAREMA_CENTER,
  zoom = 11,
  picked = null,
  onPick,
  renderPopup,
}: FireMapProps) {
  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom className="size-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter center={center} zoom={zoom} />
      {onPick && <ClickHandler onPick={onPick} />}
      {points.map((point) => (
        <Marker
          key={point.id}
          position={[point.latitude, point.longitude]}
          icon={pinIcon(statusColor(point.status))}
        >
          {renderPopup && <Popup minWidth={220}>{renderPopup(point.id)}</Popup>}
        </Marker>
      ))}
      {picked && <Marker position={[picked.lat, picked.lng]} icon={pinIcon("#e5484d")} />}
    </MapContainer>
  );
}
