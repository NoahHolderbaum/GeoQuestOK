import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import Button from '../../components/Button';
import { colors, getGlobalStyles, type Theme } from '../../commonStyles';
import { supabase } from '../../utils/supabase';
import { ensureProfileRow } from '../../lib/profiles';
import { formatMiles } from '../../lib/trails';

type Profile = {
    username: string;
    avatar_seed: string;
};

type ActivityLogDbRow = {
    id: number;
    miles: number;
    created_at: string;
    trail_id: string;
};

type TrailNameDbRow = {
    id: string;
    name: string;
};

type ActivityRow = {
    id: number;
    miles: number;
    createdAt: string;
    trailId: string;
    trailName: string;
};

function formatLoggedDate(value: string) {
    const asDate = new Date(value);
    if (Number.isNaN(asDate.getTime())) return value;

    return asDate.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

function getAccountStyles(theme: Theme) {
    return StyleSheet.create({
        overlay: {
            flex: 1,
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(0,0,0,0.45)',
        },
        sheet: {
            backgroundColor: theme.background,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            maxHeight: '88%',
            paddingTop: 20,
            paddingHorizontal: 20,
            paddingBottom: 24,
        },
        modalTitle: {
            fontFamily: 'Georgia',
            fontSize: 22,
            fontWeight: '700',
            color: theme.text,
        },
        modalSubtitle: {
            marginTop: 6,
            color: theme.subtext,
            fontSize: 13,
        },
        modalDivider: {
            height: 1,
            backgroundColor: theme.border,
            marginVertical: 16,
        },
        label: {
            fontSize: 11,
            fontWeight: '700',
            color: theme.subtext,
            letterSpacing: 1.1,
            marginBottom: 8,
        },
        input: {
            backgroundColor: theme.surface,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.border,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontSize: 16,
            color: theme.text,
        },
        modalActions: {
            flexDirection: 'row',
            gap: 10,
            marginTop: 14,
        },
        actionButton: {
            flex: 1,
            borderRadius: 12,
            paddingVertical: 12,
            alignItems: 'center',
            justifyContent: 'center',
        },
        cancelButton: {
            backgroundColor: theme.surface,
            borderWidth: 1,
            borderColor: theme.border,
        },
        saveButton: {
            backgroundColor: theme.accent,
        },
        cancelText: {
            color: theme.text,
            fontWeight: '600',
            fontSize: 15,
        },
        saveText: {
            color: '#fff',
            fontWeight: '700',
            fontSize: 15,
        },
        summaryRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        summaryText: {
            color: theme.subtext,
            fontSize: 13,
        },
        summaryValue: {
            color: theme.accent,
            fontWeight: '700',
            fontSize: 14,
        },
        logsScroll: {
            maxHeight: 440,
        },
        logRow: {
            backgroundColor: theme.surface,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: theme.border,
            padding: 12,
            marginBottom: 10,
        },
        logTopRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
        },
        logMiles: {
            color: theme.text,
            fontFamily: 'Georgia',
            fontWeight: '700',
            fontSize: 16,
        },
        logTrail: {
            color: theme.text,
            fontSize: 14,
            marginTop: 4,
            fontWeight: '600',
        },
        logDate: {
            color: theme.subtext,
            fontSize: 12,
            marginTop: 3,
        },
        deleteButton: {
            backgroundColor: '#FF3B30',
            borderRadius: 10,
            paddingHorizontal: 10,
            paddingVertical: 7,
            minWidth: 78,
            alignItems: 'center',
        },
        deleteButtonDisabled: {
            opacity: 0.6,
        },
        deleteText: {
            color: '#fff',
            fontWeight: '700',
            fontSize: 12,
        },
        emptyState: {
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 26,
        },
        emptyText: {
            color: theme.subtext,
            textAlign: 'center',
            lineHeight: 20,
        },
    });
}

export default function AccountScreen() {
    const theme = colors.light;
    const baseStyles = getGlobalStyles(theme);
    const accountStyles = getAccountStyles(theme);
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    const [editOpen, setEditOpen] = useState(false);
    const [usernameDraft, setUsernameDraft] = useState('');
    const [savingUsername, setSavingUsername] = useState(false);

    const [activityOpen, setActivityOpen] = useState(false);
    const [activityLoading, setActivityLoading] = useState(false);
    const [activityRows, setActivityRows] = useState<ActivityRow[]>([]);
    const [deletingLogId, setDeletingLogId] = useState<number | null>(null);

    const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${profile?.avatar_seed || 'default'}`;

    const totalActivityMiles = useMemo(
        () => activityRows.reduce((sum, row) => sum + Number(row.miles ?? 0), 0),
        [activityRows]
    );

    const showAlert = useCallback((title: string, message: string) => {
        if (Platform.OS === 'web') {
            alert(`${title}\n\n${message}`);
            return;
        }
        Alert.alert(title, message);
    }, []);

    const fetchProfile = useCallback(async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) return;
            setUserId(user.id);

            const { error: ensureError } = await ensureProfileRow({
                userId: user.id,
                email: user.email,
                username: user.user_metadata?.username,
            });

            if (ensureError) {
                console.error('Profile Bootstrap Error:', ensureError.message);
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('username, avatar_seed')
                .eq('id', user.id)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                setProfile(data);
                setUsernameDraft(data.username);
            }
        } catch (error: any) {
            console.error('Error fetching profile:', error.message);
            showAlert('Profile Error', error.message || 'Could not load profile.');
        } finally {
            setLoading(false);
        }
    }, [showAlert]);

    useEffect(() => {
        void fetchProfile();
    }, [fetchProfile]);

    async function saveUsername() {
        const trimmed = usernameDraft.trim();
        if (!trimmed) {
            showAlert('Invalid Username', 'Username cannot be empty.');
            return;
        }
        if (!userId) {
            showAlert('Error', 'No user found for this session.');
            return;
        }

        try {
            setSavingUsername(true);

            const { error: profileError } = await supabase
                .from('profiles')
                .update({ username: trimmed })
                .eq('id', userId);

            if (profileError) throw profileError;

            const { error: authMetadataError } = await supabase.auth.updateUser({
                data: { username: trimmed },
            });
            if (authMetadataError) {
                console.warn('Auth metadata update warning:', authMetadataError.message);
            }

            setProfile((current) => {
                if (!current) return { username: trimmed, avatar_seed: userId };
                return { ...current, username: trimmed };
            });
            setEditOpen(false);
            showAlert('Saved', 'Username updated successfully.');
        } catch (error: any) {
            console.error('Username update error:', error.message);
            showAlert('Update Failed', error.message || 'Could not update username.');
        } finally {
            setSavingUsername(false);
        }
    }

    async function openActivityData() {
        setActivityOpen(true);
        await fetchActivityRows();
    }

    async function fetchActivityRows() {
        try {
            setActivityLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: logs, error: logsError } = await supabase
                .from('activity_logs')
                .select('id, miles, created_at, trail_id')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (logsError) throw logsError;

            const logRows = (logs ?? []) as ActivityLogDbRow[];
            const trailIds = [...new Set(logRows.map((row) => String(row.trail_id)))];

            let trailNameMap = new Map<string, string>();
            if (trailIds.length > 0) {
                const { data: trails, error: trailsError } = await supabase
                    .from('trails')
                    .select('id, name')
                    .in('id', trailIds);

                if (trailsError) {
                    console.warn('Trail lookup warning:', trailsError.message);
                } else {
                    trailNameMap = new Map(
                        ((trails ?? []) as TrailNameDbRow[]).map((trail) => [String(trail.id), trail.name])
                    );
                }
            }

            const mappedRows: ActivityRow[] = logRows.map((row) => ({
                id: row.id,
                miles: Number(row.miles ?? 0),
                createdAt: row.created_at,
                trailId: String(row.trail_id),
                trailName: trailNameMap.get(String(row.trail_id)) ?? `Trail ${row.trail_id}`,
            }));

            setActivityRows(mappedRows);
        } catch (error: any) {
            console.error('Activity fetch error:', error.message);
            showAlert('Activity Error', error.message || 'Could not load activity logs.');
        } finally {
            setActivityLoading(false);
        }
    }

    async function deleteActivityRow(row: ActivityRow) {
        try {
            setDeletingLogId(row.id);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                showAlert('Error', 'No user found for this session.');
                return;
            }

            const { error: deleteError } = await supabase
                .from('activity_logs')
                .delete()
                .eq('id', row.id)
                .eq('user_id', user.id);
            if (deleteError) throw deleteError;

            const nextRows = activityRows.filter((item) => item.id !== row.id);
            setActivityRows(nextRows);

            const nextTotalMiles = nextRows.reduce((sum, item) => sum + Number(item.miles ?? 0), 0);
            const { error: totalUpdateError } = await supabase
                .from('profiles')
                .update({ total_miles_walked: nextTotalMiles })
                .eq('id', user.id);
            if (totalUpdateError) throw totalUpdateError;

            showAlert('Deleted', 'Activity log removed.');
        } catch (error: any) {
            console.error('Activity delete error:', error.message);
            showAlert('Delete Failed', error.message || 'Could not delete this activity log.');
        } finally {
            setDeletingLogId(null);
        }
    }

    function confirmDeleteActivityRow(row: ActivityRow) {
        const promptMessage = `Delete ${formatMiles(row.miles)} miles from ${row.trailName} logged on ${formatLoggedDate(row.createdAt)}?`;

        if (Platform.OS === 'web') {
            const confirmed =
                typeof globalThis.confirm === 'function'
                    ? globalThis.confirm(`Delete Activity Log\n\n${promptMessage}`)
                    : true;
            if (confirmed) {
                void deleteActivityRow(row);
            }
            return;
        }

        Alert.alert(
            'Delete Activity Log',
            promptMessage,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => void deleteActivityRow(row) },
            ]
        );
    }

    async function handleSignOut() {
        const { error } = await supabase.auth.signOut();
        if (error) {
            showAlert('Error signing out', error.message);
            return;
        }
        router.replace('/login');
    }

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', backgroundColor: theme.background }}>
                <ActivityIndicator size="large" color={theme.accent} />
            </View>
        );
    }

    return (
        <>
            <ScrollView
                style={{ flex: 1, backgroundColor: theme.background }}
                contentContainerStyle={{ flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
            >
                <View style={baseStyles.profileImageContainer}>
                    <View style={baseStyles.avatarRing}>
                        <Image
                            source={{ uri: avatarUrl }}
                            style={baseStyles.profileImage}
                            contentFit="contain"
                        />
                    </View>
                    <Text style={baseStyles.profileGreeting}>
                        Welcome back, {profile?.username || 'Explorer'}
                    </Text>
                    <Text style={baseStyles.profileSubtext}>Manage your account</Text>
                </View>

                <View style={baseStyles.AccountMain}>
                    <Button
                        label="Edit Personal Information"
                        onPress={() => {
                            setUsernameDraft(profile?.username ?? '');
                            setEditOpen(true);
                        }}
                    />

                    <Button
                        label="View All Activity Data"
                        onPress={() => {
                            void openActivityData();
                        }}
                    />

                    <Button
                        label="Sign Out"
                        onPress={() => {
                            void handleSignOut();
                        }}
                        style={{ backgroundColor: '#FF3B30' }}
                    />
                </View>
            </ScrollView>

            <Modal visible={editOpen} animationType="slide" transparent onRequestClose={() => setEditOpen(false)}>
                <View style={accountStyles.overlay}>
                    <View style={accountStyles.sheet}>
                        <Text style={accountStyles.modalTitle}>Edit Personal Information</Text>
                        <Text style={accountStyles.modalSubtitle}>Update your username.</Text>
                        <View style={accountStyles.modalDivider} />

                        <Text style={accountStyles.label}>USERNAME</Text>
                        <TextInput
                            value={usernameDraft}
                            onChangeText={setUsernameDraft}
                            autoCapitalize="none"
                            style={accountStyles.input}
                            editable={!savingUsername}
                            placeholder="Choose a username"
                            placeholderTextColor={theme.subtext}
                        />

                        <View style={accountStyles.modalActions}>
                            <Pressable
                                style={[accountStyles.actionButton, accountStyles.cancelButton]}
                                onPress={() => setEditOpen(false)}
                                disabled={savingUsername}
                            >
                                <Text style={accountStyles.cancelText}>Cancel</Text>
                            </Pressable>
                            <Pressable
                                style={[accountStyles.actionButton, accountStyles.saveButton]}
                                onPress={() => {
                                    void saveUsername();
                                }}
                                disabled={savingUsername}
                            >
                                {savingUsername ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text style={accountStyles.saveText}>Save</Text>
                                )}
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={activityOpen}
                animationType="slide"
                transparent
                onRequestClose={() => setActivityOpen(false)}
            >
                <View style={accountStyles.overlay}>
                    <View style={accountStyles.sheet}>
                        <Text style={accountStyles.modalTitle}>All Activity Data</Text>
                        <View style={accountStyles.modalDivider} />

                        <View style={accountStyles.summaryRow}>
                            <Text style={accountStyles.summaryText}>Entries: {activityRows.length}</Text>
                            <Text style={accountStyles.summaryValue}>
                                Total: {formatMiles(totalActivityMiles)} mi
                            </Text>
                        </View>

                        <View style={accountStyles.modalDivider} />

                        {activityLoading ? (
                            <View style={accountStyles.emptyState}>
                                <ActivityIndicator size="large" color={theme.accent} />
                                <Text style={[accountStyles.emptyText, { marginTop: 10 }]}>
                                    Loading your activity...
                                </Text>
                            </View>
                        ) : activityRows.length === 0 ? (
                            <View style={accountStyles.emptyState}>
                                <Text style={accountStyles.emptyText}>
                                    No activity logged yet.
                                </Text>
                            </View>
                        ) : (
                            <ScrollView style={accountStyles.logsScroll} showsVerticalScrollIndicator={false}>
                                {activityRows.map((row) => (
                                    <View key={row.id} style={accountStyles.logRow}>
                                        <View style={accountStyles.logTopRow}>
                                            <Text style={accountStyles.logMiles}>
                                                {formatMiles(row.miles)} mi
                                            </Text>
                                            <Pressable
                                                style={[
                                                    accountStyles.deleteButton,
                                                    deletingLogId === row.id && accountStyles.deleteButtonDisabled,
                                                ]}
                                                onPress={() => confirmDeleteActivityRow(row)}
                                                disabled={deletingLogId !== null}
                                            >
                                                <Text style={accountStyles.deleteText}>
                                                    {deletingLogId === row.id ? 'Deleting' : 'Delete'}
                                                </Text>
                                            </Pressable>
                                        </View>
                                        <Text style={accountStyles.logTrail}>{row.trailName}</Text>
                                        <Text style={accountStyles.logDate}>{formatLoggedDate(row.createdAt)}</Text>
                                    </View>
                                ))}
                            </ScrollView>
                        )}

                        <View style={accountStyles.modalActions}>
                            <Pressable
                                style={[accountStyles.actionButton, accountStyles.cancelButton]}
                                onPress={() => setActivityOpen(false)}
                            >
                                <Text style={accountStyles.cancelText}>Close</Text>
                            </Pressable>
                            <Pressable
                                style={[accountStyles.actionButton, accountStyles.saveButton]}
                                onPress={() => {
                                    void fetchActivityRows();
                                }}
                                disabled={activityLoading}
                            >
                                {activityLoading ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text style={accountStyles.saveText}>Refresh</Text>
                                )}
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
}
