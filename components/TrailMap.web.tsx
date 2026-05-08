// components/TrailMap.web.tsx
// Leaflet touches `window` on import, which crashes Metro's SSR pass.
// Solution: lazy-load the real map only after the component mounts in the browser.

import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

// LeafletMap is defined below and only ever imported client-side via useState + useEffect.
// It is never statically imported at the top level, so Metro's SSR pass never evaluates it.

export default function TrailMap(props: any) {
    const { dStyles, theme } = props;

    // Start as null — we render a placeholder until the browser is ready
    const [LeafletMap, setLeafletMap] = useState<React.ComponentType<any> | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // This runs only in the browser, never during SSR
        // Dynamic import keeps Leaflet out of the SSR bundle entirely
        import('./LeafletMap')
            .then(mod => {
                setLeafletMap(() => mod.default);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <View style={[dStyles.mapContainer, { alignItems: 'center', justifyContent: 'center', backgroundColor: theme.border }]}>
                <ActivityIndicator color={theme.accent} size="large" />
                <Text style={{ fontFamily: 'Georgia', fontSize: 13, color: theme.subtext, marginTop: 12 }}>
                    Loading map…
                </Text>
            </View>
        );
    }

    if (!LeafletMap) {
        return (
            <View style={[dStyles.mapContainer, { alignItems: 'center', justifyContent: 'center', backgroundColor: theme.border }]}>
                <Text style={{ fontSize: 36, marginBottom: 10 }}>🗺️</Text>
                <Text style={{ fontFamily: 'Georgia', fontSize: 14, color: theme.subtext }}>
                    Map unavailable
                </Text>
            </View>
        );
    }

    return <LeafletMap {...props} />;
}
