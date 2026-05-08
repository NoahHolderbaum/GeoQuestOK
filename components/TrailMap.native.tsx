// components/TrailMap.native.tsx
// Used on iOS and Android. react-native-maps is never imported on web.

import { View, Pressable, Text } from 'react-native';
import { useEffect } from 'react';
import MapView, { Polyline, Marker, Circle, PROVIDER_DEFAULT } from 'react-native-maps';

export default function TrailMap({
    walkedCoords,
    remainingCoords,
    allLandmarks,
    trailCoords,
    trailRegion,
    userPosition,
    milesWalked,
    mapRef,
    dStyles,
    theme,
    onLandmarkPress,
    onRecenter,
}: any) {
    useEffect(() => {
        if (!mapRef?.current || trailCoords?.length < 2) return;

        mapRef.current.fitToCoordinates(trailCoords, {
            edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
            animated: true,
        });
    }, [mapRef, trailCoords]);

    return (
        <View style={dStyles.mapContainer}>
            <MapView
                ref={mapRef}
                style={dStyles.map}
                provider={PROVIDER_DEFAULT}
                onMapReady={() => {
                    if (trailCoords?.length < 2 || !mapRef?.current) return;
                    mapRef.current.fitToCoordinates(trailCoords, {
                        edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
                        animated: true,
                    });
                }}
                initialRegion={
                    trailRegion
                        ? trailRegion
                        : {
                            latitude: userPosition.latitude,
                            longitude: userPosition.longitude,
                            latitudeDelta: 0.25,
                            longitudeDelta: 0.25,
                        }
                }
            >
                {/* Walked portion — solid accent colour */}
                {walkedCoords.length > 1 && (
                    <Polyline
                        coordinates={walkedCoords}
                        strokeColor={theme.accent}
                        strokeWidth={4}
                    />
                )}

                {/* Remaining portion — dashed grey */}
                {remainingCoords.length > 1 && (
                    <Polyline
                        coordinates={remainingCoords}
                        strokeColor={theme.subtext}
                        strokeWidth={3}
                        lineDashPattern={[8, 4]}
                    />
                )}

                {/* Landmark markers */}
                {allLandmarks.map((landmark: any) => (
                    <Marker
                        key={landmark.id}
                        coordinate={landmark.coordinate}
                        title={landmark.title}
                        onPress={() => onLandmarkPress(landmark)}
                    >
                        <View style={[
                            dStyles.landmarkDot,
                            landmark.mileMarker <= Math.ceil(milesWalked)
                                ? dStyles.landmarkDotPassed
                                : dStyles.landmarkDotFuture,
                        ]} />
                    </Marker>
                ))}

                {/* User position */}
                <Marker coordinate={userPosition} anchor={{ x: 0.5, y: 0.5 }}>
                    <View style={dStyles.userMarkerOuter}>
                        <View style={dStyles.userMarkerInner} />
                    </View>
                </Marker>

                {/* Pulse ring */}
                <Circle
                    center={userPosition}
                    radius={80}
                    fillColor={theme.accent + '22'}
                    strokeColor={theme.accent + '66'}
                    strokeWidth={1}
                />
            </MapView>

            {/* Re-center button */}
            <Pressable style={dStyles.recenterButton} onPress={onRecenter}>
                <Text style={dStyles.recenterIcon}>◎</Text>
            </Pressable>
        </View>
    );
}
