import {
    Text,
    View,
    ScrollView,
    Pressable,
    Modal,
    ActivityIndicator,
    useColorScheme,
    StatusBar,
    Alert,
} from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { Image } from 'expo-image';
import { colors, getTrailStyles } from '../../commonStyles';
import RoutePreviewMap from '../../components/RoutePreviewMap';
import { fetchTrailDetails, fetchTrailList, formatMiles, type TrailSummary as Trail } from '../../lib/trails';


// ─── Difficulty badge colour ───────────────────────────────────────────────────

const DIFFICULTY_COLORS: Record<Trail['difficulty'], string> = {
    'Easiest': '#4CAF50',
    'Easy': '#8BC34A',
    'Easy-Moderate': '#CDDC39',
    'Moderate': '#FFC107',
    'Moderate-Difficult': '#FF9800',
    'Difficult': '#FF5722',
    'Very Difficult': '#E53935',
    'Most Difficult': '#B71C1C',
};

// ─── Trail Card ───────────────────────────────────────────────────────────────

function TrailCard({ trail, onPress, tStyles }: {
    trail: Trail;
    onPress: () => void;
    tStyles: ReturnType<typeof getTrailStyles>;
}) {
    const diffColor = DIFFICULTY_COLORS[trail.difficulty];
    const imageUri = trail.image_url?.trim();
    return (
        <Pressable
            style={({ pressed }) => [tStyles.card, pressed && tStyles.cardPressed]}
            onPress={onPress}
        >
            {/* Hero image */}
            {imageUri ? (
                <Image
                    source={{ uri: imageUri }}
                    style={tStyles.cardImage}
                    contentFit="cover"
                    transition={200}
                />
            ) : (
                <View
                    style={[
                        tStyles.cardImage,
                        {
                            alignItems: 'center',
                            justifyContent: 'center',
                        },
                    ]}
                >
                    <Text style={{ color: '#FFFFFF', fontSize: 28 }}>
                        🗺️
                    </Text>
                </View>
            )}

            {/* Difficulty badge — floats over image */}
            <View style={[tStyles.difficultyBadge, { backgroundColor: diffColor + 'EE' }]}>
                <Text style={tStyles.difficultyBadgeText}>{trail.difficulty}</Text>
            </View>

            {/* Info row below image */}
            <View style={tStyles.cardBody}>
                <Text style={tStyles.cardTitle} numberOfLines={1}>{trail.name}</Text>
                <View style={tStyles.cardMeta}>
                    <Text style={tStyles.cardDistance}>📍 {formatMiles(trail.miles)} miles</Text>
                </View>
                <Text style={tStyles.cardRoute} numberOfLines={1}>{trail.route}</Text>
            </View>
        </Pressable>
    );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function TrailModal({ trail, routeGeojson, routePreviewLoading, onClose, scheme, tStyles }: {
    trail: Trail;
    routeGeojson: any;
    routePreviewLoading: boolean;
    onClose: () => void;
    scheme: 'light' | 'dark';
    tStyles: ReturnType<typeof getTrailStyles>;
}) {
    const diffColor = DIFFICULTY_COLORS[trail.difficulty];
    const imageUri = trail.image_url?.trim();
    const trailCoords = useMemo(() => geojsonLineToCoords(routeGeojson), [routeGeojson]);
    const previewRegion = useMemo(() => getTrailRegion(trailCoords), [trailCoords]);

    return (
        <Modal
            visible
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <View style={tStyles.modalOverlay}>
                <View style={tStyles.modalSheet}>
                    {/* Hero */}
                    {imageUri ? (
                        <Image
                            source={{ uri: imageUri }}
                            style={tStyles.modalImage}
                            contentFit="cover"
                        />
                    ) : (
                        <View style={[tStyles.modalImage, { alignItems: 'center', justifyContent: 'center', backgroundColor: colors[scheme].border }]}>
                            <Text style={{ color: colors[scheme].subtext, fontSize: 34 }}>🗺️</Text>
                        </View>
                    )}

                    {/* Close pill */}
                    <Pressable style={tStyles.closeButton} onPress={onClose}>
                        <Text style={tStyles.closeButtonText}>✕</Text>
                    </Pressable>

                    {/* Difficulty badge */}
                    <View style={[tStyles.modalDiffBadge, { backgroundColor: diffColor }]}>
                        <Text style={tStyles.difficultyBadgeText}>{trail.difficulty}</Text>
                    </View>

                    {/* Content */}
                    <ScrollView
                        style={tStyles.modalScroll}
                        contentContainerStyle={tStyles.modalContent}
                        showsVerticalScrollIndicator={false}
                    >
                        <Text style={tStyles.modalTitle}>{trail.name}</Text>
                        <Text style={tStyles.modalDistance}>{formatMiles(trail.miles)} miles</Text>

                        <View style={tStyles.modalDivider} />

                        <Text style={tStyles.modalSectionLabel}>ROUTE</Text>
                        <Text style={tStyles.modalBodyText}>{trail.route}</Text>

                        <Text style={tStyles.modalSectionLabel}>HIGHLIGHTS</Text>
                        {trail.highlights.map((h, i) => (
                            <Text key={i} style={tStyles.modalBullet}>· {h}</Text>
                        ))}

                        <Text style={tStyles.modalSectionLabel}>HISTORICAL FOCUS</Text>
                        <Text style={tStyles.modalBodyText}>{trail.historicalFocus}</Text>

                        <Text style={tStyles.modalSectionLabel}>ROUTE PREVIEW</Text>
                        <View style={tStyles.previewMapFrame}>
                            {routePreviewLoading ? (
                                <View style={tStyles.previewLoading}>
                                    <ActivityIndicator size="small" color={colors[scheme].accent} />
                                    <Text style={tStyles.previewLoadingText}>Loading route preview…</Text>
                                </View>
                            ) : (
                                <RoutePreviewMap
                                    coords={trailCoords}
                                    region={previewRegion}
                                    accentColor={colors[scheme].accent}
                                    subtextColor={colors[scheme].subtext}
                                    borderColor={colors[scheme].border}
                                />
                            )}
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function TrailsScreen() {
    const rawScheme = useColorScheme();
    const scheme: 'light' | 'dark' = rawScheme === 'dark' ? 'dark' : 'light';
    const theme = colors[scheme];
    const tStyles = getTrailStyles(theme);

    const [selected, setSelected] = useState<Trail | null>(null);
    const [selectedRouteGeojson, setSelectedRouteGeojson] = useState<any>(null);
    const [routePreviewLoading, setRoutePreviewLoading] = useState(false);
    const [trails, setTrails] = useState<Trail[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        async function loadTrails() {
            try {
                const data = await fetchTrailList();

                if (isMounted) {
                    setTrails(data);
                }
            } catch (error) {
                console.error('Failed to load trails:', error);

                if (isMounted) {
                    Alert.alert(
                        'Error',
                        'Unable to load trails right now.'
                    );
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        loadTrails();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        let isMounted = true;

        async function loadSelectedRouteGeojson() {
            if (!selected) {
                setSelectedRouteGeojson(null);
                setRoutePreviewLoading(false);
                return;
            }

            setRoutePreviewLoading(true);
            try {
                const detail = await fetchTrailDetails(String(selected.id));
                if (isMounted) {
                    setSelectedRouteGeojson(detail?.routeGeojson ?? null);
                }
            } catch {
                if (isMounted) {
                    setSelectedRouteGeojson(null);
                }
            } finally {
                if (isMounted) {
                    setRoutePreviewLoading(false);
                }
            }
        }

        loadSelectedRouteGeojson();

        return () => {
            isMounted = false;
        };
    }, [selected]);

    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={tStyles.header}>
                <Text style={tStyles.headerTitle}>Trails</Text>
                <Text style={tStyles.headerSubtitle}>{trails.length} routes to explore</Text>
            </View>

            {/* Card list */}
            <ScrollView
                contentContainerStyle={tStyles.list}
                showsVerticalScrollIndicator={false}
            >
                {loading && (
                    <ActivityIndicator
                        size="large"
                        color={theme.accent}
                        style={{ marginVertical: 24 }}
                    />
                )}
                {trails.map(trail => (
                    <TrailCard
                        key={trail.id}
                        trail={trail}
                        onPress={() => setSelected(trail)}
                        tStyles={tStyles}
                    />
                ))}
            </ScrollView>

            {/* Detail modal */}
            {selected && (
                <TrailModal
                    trail={selected}
                    routeGeojson={selectedRouteGeojson}
                    routePreviewLoading={routePreviewLoading}
                    onClose={() => setSelected(null)}
                    scheme={scheme}
                    tStyles={tStyles}
                />
            )}
        </View>
    );
}

type Coordinate = { latitude: number; longitude: number };

function geojsonLineToCoords(geojson: any): Coordinate[] {
    if (!Array.isArray(geojson?.features)) return [];

    const coords: Coordinate[] = [];

    const pushCoords = (value: any) => {
        if (!Array.isArray(value)) return;

        if (value.length >= 2 && typeof value[0] === 'number' && typeof value[1] === 'number') {
            coords.push({ latitude: value[1], longitude: value[0] });
            return;
        }

        for (const item of value) {
            pushCoords(item);
        }
    };

    for (const feature of geojson.features) {
        pushCoords(feature?.geometry?.coordinates);
    }

    return coords;
}

function getTrailRegion(coords: Coordinate[]) {
    if (!coords.length) {
        return {
            latitude: 35.4676,
            longitude: -97.5164,
            latitudeDelta: 0.25,
            longitudeDelta: 0.25,
        };
    }

    const bounds = coords.reduce(
        (acc, coord) => ({
            minLat: Math.min(acc.minLat, coord.latitude),
            maxLat: Math.max(acc.maxLat, coord.latitude),
            minLng: Math.min(acc.minLng, coord.longitude),
            maxLng: Math.max(acc.maxLng, coord.longitude),
        }),
        {
            minLat: coords[0].latitude,
            maxLat: coords[0].latitude,
            minLng: coords[0].longitude,
            maxLng: coords[0].longitude,
        }
    );

    const latitudeDelta = Math.max((bounds.maxLat - bounds.minLat) * 1.35, 0.08);
    const longitudeDelta = Math.max((bounds.maxLng - bounds.minLng) * 1.35, 0.08);

    return {
        latitude: (bounds.minLat + bounds.maxLat) / 2,
        longitude: (bounds.minLng + bounds.maxLng) / 2,
        latitudeDelta,
        longitudeDelta,
    };
}
