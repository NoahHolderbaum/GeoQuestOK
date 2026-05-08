// components/LeafletMap.tsx
// This file is ONLY ever loaded via dynamic import() from TrailMap.web.tsx.
// It is never statically imported, so Leaflet's `window` references never
// run during Metro's SSR pass.

import { View } from 'react-native';
import { useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// ─── Re-center button ─────────────────────────────────────────────────────────

function RecenterButton({ position, theme }: { position: [number, number]; theme: any }) {
    const map = useMap();
    return (
        <div
            style={{
                position: 'absolute',
                bottom: 16,
                right: 16,
                zIndex: 1000,
                width: 36,
                height: 36,
                borderRadius: '50%',
                backgroundColor: theme.surface,
                border: `1px solid ${theme.border}`,
                boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: 18,
                color: theme.accent,
                userSelect: 'none',
            }}
            onClick={() => map.flyTo(position, 14, { animate: true, duration: 0.6 })}
        >
            ◎
        </div>
    );
}

// ─── Main Leaflet map ─────────────────────────────────────────────────────────

export default function LeafletMap({
    walkedCoords,
    remainingCoords,
    allLandmarks,
    trailCoords,
    trailRegion,
    userPosition,
    milesWalked,
    dStyles,
    theme,
    onLandmarkPress,
}: any) {
    const toLatLng = (c: { latitude: number; longitude: number }): [number, number] =>
        [c.latitude, c.longitude];

    const center: [number, number] = trailRegion
        ? [trailRegion.latitude, trailRegion.longitude]
        : toLatLng(userPosition);
    const walkedLatLngs = walkedCoords.map(toLatLng);
    const remainingLatLngs = remainingCoords.map(toLatLng);
    const passedMile = Math.ceil(milesWalked);

    function BoundsUpdater({ trailCoords }: { trailCoords: any[] }) {
        const map = useMap();

        useEffect(() => {
            if (!trailCoords?.length) return;
            const latLngs = trailCoords.map(toLatLng);
            map.fitBounds(L.latLngBounds(latLngs), { padding: [40, 40] });
        }, [map, trailCoords]);

        return null;
    }

    return (
        <View style={dStyles.mapContainer}>
            <MapContainer
                center={center}
                zoom={14}
                style={{ width: '100%', height: '100%' }}
                zoomControl
                scrollWheelZoom
            >
                <BoundsUpdater trailCoords={trailCoords} />
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />



                {/* Walked portion — solid accent */}
                {walkedLatLngs.length > 1 && (
                    <Polyline
                        positions={walkedLatLngs}
                        pathOptions={{ color: theme.accent, weight: 4, opacity: 1 }}
                    />
                )}

                {/* Remaining portion — dashed grey */}
                {remainingLatLngs.length > 1 && (
                    <Polyline
                        positions={remainingLatLngs}
                        pathOptions={{ color: theme.subtext, weight: 3, opacity: 0.5, dashArray: '8, 4' }}
                    />
                )}

                {/* Landmark markers */}
                {allLandmarks.map((landmark: any) => {
                    const passed = landmark.mileMarker <= passedMile;
                    return (
                        <CircleMarker
                            key={landmark.id}
                            center={toLatLng(landmark.coordinate)}
                            radius={6}
                            pathOptions={{
                                fillColor: passed ? theme.accent : theme.subtext,
                                fillOpacity: 0.9,
                                color: '#fff',
                                weight: 2,
                            }}
                            eventHandlers={{ click: () => onLandmarkPress(landmark) }}
                        >
                            <Popup>
                                <strong style={{ fontFamily: 'Georgia' }}>{landmark.title}</strong>
                                <br />
                                <span style={{ fontSize: 12, color: '#888' }}>Mile ~{landmark.mileMarker}</span>
                            </Popup>
                        </CircleMarker>
                    );
                })}

                {/* User position */}
                <CircleMarker
                    center={toLatLng(userPosition)}
                    radius={9}
                    pathOptions={{ fillColor: theme.accent, fillOpacity: 1, color: '#fff', weight: 3 }}
                >
                    <Popup>
                        <strong style={{ fontFamily: 'Georgia' }}>You are here</strong>
                    </Popup>
                </CircleMarker>

                <RecenterButton position={toLatLng(userPosition)} theme={theme} />
            </MapContainer>
        </View>
    );
}
