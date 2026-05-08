import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useColorScheme } from 'react-native';
import { colors } from '../../commonStyles';

export default function TabLayout() {
    const scheme = useColorScheme() ?? 'light';
    const theme = colors[scheme];

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: theme.accent,
                tabBarInactiveTintColor: theme.subtext,
                tabBarStyle: {
                    backgroundColor: theme.surface,
                    borderTopColor: theme.border,
                },
            }}
        >
            <Tabs.Screen name="dashboard" options={{
                title: 'Dashboard', tabBarIcon: ({ color, focused }) => (
                    <Ionicons name={focused ? 'home-sharp' : 'home-outline'} color={color} size={24} />
                ),
            }} />
            <Tabs.Screen name="leaderboard" options={{
                title: 'Leaderboard', tabBarIcon: ({ color, focused }) => (
                    <Ionicons name={focused ? 'ribbon-sharp' : 'ribbon-outline'} color={color} size={24} />
                ),
            }} />
            <Tabs.Screen name="trails" options={{
                title: 'Trails', tabBarIcon: ({ color, focused }) => (
                    <Ionicons name={focused ? 'earth-sharp' : 'earth-outline'} color={color} size={24} />
                ),
            }} />
            <Tabs.Screen name="account" options={{
                title: 'Account', tabBarIcon: ({ color, focused }) => (
                    <Ionicons name={focused ? 'person-circle-sharp' : 'person-circle-outline'} color={color} size={24} />
                ),
            }} />
        </Tabs>
    );
}