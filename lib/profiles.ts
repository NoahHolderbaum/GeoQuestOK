import { supabase } from '../utils/supabase';

type EnsureProfileParams = {
    userId: string;
    email?: string | null;
    username?: string | null;
};

function buildFallbackUsername({
    username,
    email,
}: {
    username?: string | null;
    email?: string | null;
}): string {
    const provided = username?.trim();
    if (provided) return provided.slice(0, 40);

    const fromEmail = email?.split('@')[0]?.trim();
    if (fromEmail) return fromEmail.slice(0, 40);

    return 'Explorer';
}

export async function ensureProfileRow({
    userId,
    email,
    username,
}: EnsureProfileParams) {
    const safeUsername = buildFallbackUsername({ username, email });

    return supabase
        .from('profiles')
        .upsert(
            {
                id: userId,
                username: safeUsername,
                avatar_seed: userId,
                total_miles_walked: 0,
            },
            {
                onConflict: 'id',
                ignoreDuplicates: true,
            }
        );
}
