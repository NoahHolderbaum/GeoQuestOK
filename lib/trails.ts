import { supabase } from '../utils/supabase';

export type TrailDifficulty =
    | 'Easiest'
    | 'Easy'
    | 'Easy-Moderate'
    | 'Moderate'
    | 'Moderate-Difficult'
    | 'Difficult'
    | 'Very Difficult'
    | 'Most Difficult';

export type TrailSummary = {
    id: string;
    name: string;
    miles: number;
    difficulty: TrailDifficulty;
    route: string;
    highlights: string[];
    historicalFocus: string;
    image_url?: string | null;

};

export type TrailDetails = TrailSummary & {
    routeGeojson: any;
    landmarksGeojson: any;
    isActive: boolean;
};

export function formatMiles(miles: number): string {
    return Number.isFinite(miles) ? miles.toFixed(2) : '0.00';
}

type TrailRow = {
    id: string;
    name: string;
    miles: number | string;
    difficulty: TrailDifficulty;
    route: string | null;
    highlights: string[] | null;
    historical_focus: string | null;
    map_url: string | null;
    image_url: string | null;
    route_geojson?: any;
    landmarks_geojson?: any;
    is_active?: boolean | null;
};

function normalizeTrail(row: TrailRow): TrailSummary {
    return {
        id: String(row.id),
        name: row.name,
        miles: Number(row.miles),
        difficulty: row.difficulty,
        route: row.route ?? '',
        highlights: row.highlights ?? [],
        historicalFocus: row.historical_focus ?? '',
        image_url: row.image_url ?? '',

    };
}

export async function fetchTrailList(): Promise<TrailSummary[]> {
    const { data, error } = await supabase
        .from('trails')
        .select('id, name, miles, difficulty, route, highlights, historical_focus, image_url')
        .eq('is_active', true)
        .order('miles', { ascending: true });

    if (error) throw error;

    return (data ?? []).map((row) => normalizeTrail(row as TrailRow));
}

export async function fetchTrailDetails(id: string) {
    const { data, error } = await supabase
        .from('trails')
        .select('id, name, miles, difficulty, route_geojson, landmarks_geojson') // Ensure these match your DB columns
        .eq('id', id)
        .single();

    if (error) throw error;

    return {
        ...data,
        // Map database naming to your component's expected camelCase names
        routeGeojson: data.route_geojson,
        landmarksGeojson: data.landmarks_geojson
    };
}