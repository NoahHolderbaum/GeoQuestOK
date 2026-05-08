import { Text, View, ScrollView, Pressable } from 'react-native';
import { useState } from 'react';
import { colors, getGlobalStyles, getLeaderboardStyles, testUser } from '../../commonStyles';
import { Image } from 'expo-image';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Group = {
    id: string;
    label: string;
};

export type LeaderboardEntry = {
    id: string;
    name: string;
    profilePicture: any;
    score: number;
    rank: number;
    isCurrentUser?: boolean;
};

// ─── Placeholder data (swap for API calls later) ──────────────────────────────

const GROUPS: Group[] = [
    { id: 'all', label: 'All' },
    { id: 'aaa111', label: 'School' },
    { id: 'aaa112', label: 'Youth Group' },
    { id: 'aaa113', label: '4th hour geography' },
];

const MOCK_ENTRIES: Record<string, LeaderboardEntry[]> = {
    all: [
        { id: '1', name: 'Noah', profilePicture: testUser.profilePicture, score: 27, rank: 1, isCurrentUser: true },
        { id: '2', name: 'Sarah', profilePicture: testUser.profilePicture, score: 26.5, rank: 2 },
        { id: '3', name: 'Marcus', profilePicture: testUser.profilePicture, score: 24, rank: 3 },
        { id: '4', name: 'Leila', profilePicture: testUser.profilePicture, score: 24, rank: 4 },
        { id: '5', name: 'James', profilePicture: testUser.profilePicture, score: 20, rank: 5 },
        { id: '6', name: 'Priya', profilePicture: testUser.profilePicture, score: 18, rank: 6 },
        { id: '7', name: 'Tyler', profilePicture: testUser.profilePicture, score: 10, rank: 7 },
    ],
    aaa111: [
        { id: '2', name: 'Sarah', profilePicture: testUser.profilePicture, score: 30, rank: 1 },
        { id: '1', name: 'Noah', profilePicture: testUser.profilePicture, score: 27, rank: 2, isCurrentUser: true },
        { id: '5', name: 'James', profilePicture: testUser.profilePicture, score: 25, rank: 3 },
        { id: '7', name: 'Tyler', profilePicture: testUser.profilePicture, score: 24, rank: 4 },
    ],
    aaa112: [
        { id: '3', name: 'Marcus', profilePicture: testUser.profilePicture, score: 30, rank: 1 },
        { id: '6', name: 'Priya', profilePicture: testUser.profilePicture, score: 28, rank: 2 },
        { id: '1', name: 'Noah', profilePicture: testUser.profilePicture, score: 27, rank: 3, isCurrentUser: true },
    ],
    aaa113: [
        { id: '4', name: 'Leila', profilePicture: testUser.profilePicture, score: 29, rank: 1 },
        { id: '1', name: 'Noah', profilePicture: testUser.profilePicture, score: 27, rank: 2, isCurrentUser: true },
        { id: '2', name: 'Sarah', profilePicture: testUser.profilePicture, score: 20, rank: 3 },
    ],
};

// ─── Medal colours ────────────────────────────────────────────────────────────
const MEDAL_COLORS = ['#DE9027', '#9E9E9E', '#C07B3A'];

// ─── Podium card ──────────────────────────────────────────────────────────────
//
// Layout (top → bottom):
//   name + score  ← always visible above the base
//   avatar        ← sits on top of the base, centred
//   coloured base ← height varies by rank
//
function PodiumCard({
    entry,
    baseHeight,
    lStyles,
}: {
    entry: LeaderboardEntry;
    baseHeight: number;
    lStyles: ReturnType<typeof getLeaderboardStyles>;
}) {
    const medalColor = MEDAL_COLORS[entry.rank - 1] ?? '#EAE0D5';

    return (
        <View style={lStyles.podiumSlot}>
            {/* Name + score — rendered first so they sit above avatar */}
            <Text style={lStyles.podiumName} numberOfLines={1}>
                {entry.name}
            </Text>
            <Text style={lStyles.podiumScore}>{entry.score.toLocaleString()} miles</Text>

            {/* Avatar overlapping the top of the base */}
            <View style={[lStyles.podiumAvatarRing, { borderColor: medalColor }]}>
                <Image
                    source={entry.profilePicture}
                    style={lStyles.podiumAvatar}
                    contentFit="cover"
                />
            </View>

            {/* Coloured base — height drives the podium step effect */}
            <View style={[lStyles.podiumBase, { backgroundColor: medalColor, height: baseHeight }]}>
                <Text style={lStyles.podiumRankLabel}>
                    {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                </Text>
            </View>
        </View>
    );
}

// ─── List row (rank 4+) ───────────────────────────────────────────────────────

function LeaderboardRow({
    entry,
    lStyles,
}: {
    entry: LeaderboardEntry;
    lStyles: ReturnType<typeof getLeaderboardStyles>;
}) {
    return (
        <View style={[lStyles.row, entry.isCurrentUser && lStyles.rowHighlighted]}>
            <Text style={lStyles.rowRank}>#{entry.rank}</Text>
            <View style={lStyles.rowAvatarRing}>
                <Image
                    source={entry.profilePicture}
                    style={lStyles.rowAvatar}
                    contentFit="cover"
                />
            </View>
            <Text style={[lStyles.rowName, entry.isCurrentUser && lStyles.rowNameHighlighted]}>
                {entry.name}{entry.isCurrentUser ? ' (You)' : ''}
            </Text>
            <Text style={lStyles.rowScore}>{entry.score.toLocaleString()} miles</Text>
        </View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function LeaderboardScreen() {
    const theme = colors['light'];
    const lStyles = getLeaderboardStyles(theme);

    const [activeGroup, setActiveGroup] = useState<string>('all');
    const entries = MOCK_ENTRIES[activeGroup] ?? [];

    const top3 = entries.slice(0, 3);
    const rest = entries.slice(3);

    // Visual order on podium: 2nd (left) | 1st (centre) | 3rd (right)
    // Base heights:            1st = 110, 2nd = 80, 3rd = 60
    const podiumVisualOrder = top3.length === 3
        ? [
            { entry: top3[1], baseHeight: 80 },   // 2nd — left
            { entry: top3[0], baseHeight: 110 },   // 1st — centre, tallest
            { entry: top3[2], baseHeight: 60 },   // 3rd — right
        ]
        : top3.map((e, i) => ({ entry: e, baseHeight: 110 - i * 25 }));

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: theme.background }}
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
        >
            {/* ── Header ── */}
            <View style={lStyles.header}>
                <Text style={lStyles.headerTitle}>Leaderboard</Text>
                <Text style={lStyles.headerSubtitle}>See how you rank</Text>
            </View>

            {/* ── Group filter tabs ── */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={lStyles.tabsContainer}
                style={lStyles.tabsScroll}
            >
                {GROUPS.map(group => (
                    <Pressable
                        key={group.id}
                        style={[lStyles.tab, activeGroup === group.id && lStyles.tabActive]}
                        onPress={() => setActiveGroup(group.id)}
                    >
                        <Text style={[lStyles.tabLabel, activeGroup === group.id && lStyles.tabLabelActive]}>
                            {group.label}
                        </Text>
                    </Pressable>
                ))}
            </ScrollView>

            {/* ── Podium — clear separation below tabs ── */}
            {top3.length >= 2 && (
                <View style={lStyles.podiumContainer}>
                    {podiumVisualOrder.map(({ entry, baseHeight }) => (
                        <PodiumCard
                            key={entry.id}
                            entry={entry}
                            baseHeight={baseHeight}
                            lStyles={lStyles}
                        />
                    ))}
                </View>
            )}

            {/* ── Rows 4+ ── */}
            {rest.length > 0 && (
                <View style={lStyles.listContainer}>
                    {rest.map(entry => (
                        <LeaderboardRow key={entry.id} entry={entry} lStyles={lStyles} />
                    ))}
                </View>
            )}

            {entries.length === 0 && (
                <View style={lStyles.emptyState}>
                    <Text style={lStyles.emptyText}>No members in this group yet.</Text>
                </View>
            )}
        </ScrollView>
    );
}
