import React, { useState } from 'react';
import { View, Text, TextInput, Alert, StyleSheet } from 'react-native';
import { supabase } from '../utils/supabase';
import { useRouter } from 'expo-router';
import Button from '../components/Button';

export default function ResetPassword() {
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function updatePassword() {
        if (newPassword.length < 6) {
            Alert.alert("Error", "Password must be at least 6 characters.");
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) {
            Alert.alert("Error", error.message);
        } else {
            Alert.alert("Success", "Password updated! Logging you in...");
            router.replace('/(tabs)/dashboard');
        }
        setLoading(false);
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Create New Password</Text>
            <TextInput
                style={styles.input}
                placeholder="New Password"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
            />
            <Button
                label={loading ? "Updating..." : "Update Password"}
                onPress={updatePassword}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    input: { borderWidth: 1, borderColor: '#ccc', padding: 15, borderRadius: 8, marginBottom: 15 }
});