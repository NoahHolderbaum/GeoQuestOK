import React, { useState } from 'react';
import { Alert, TextInput, Text, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../utils/supabase';
import { useRouter, Link } from 'expo-router';
import Button from '../components/Button'; // Use your newly fixed Button!
import { ensureProfileRow } from '../lib/profiles';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Helper to ensure alerts display correctly on both Web and Mobile devices
    const showAlert = (title: string, message: string) => {
        console.warn(`[ALERT] ${title}: ${message}`);
        if (Platform.OS === 'web') {
            alert(`${title}\n\n${message}`);
        } else {
            Alert.alert(title, message);
        }
    };

    async function signInWithEmail() {
        console.log("--- Login Attempt Started ---");
        console.log("Target Email:", email);

        if (!email.trim() || !password) {
            showAlert("Missing Fields", "Please enter your email and password.");
            return;
        }

        // Fail-safe check if Supabase didn't initialize
        if (!supabase) {
            showAlert("Configuration Error", "Supabase client is not initialized. Please verify your utils/supabase configuration.");
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) {
                console.error("Supabase Authentication Error:", error);
                showAlert("Login Failed", error.message);
                return;
            }

            console.log("Supabase Login Successful. Session data:", data);

            if (data.session) {
                if (data.user) {
                    const { error: profileError } = await ensureProfileRow({
                        userId: data.user.id,
                        email: data.user.email,
                        username: data.user.user_metadata?.username,
                    });

                    if (profileError) {
                        console.error("Profile Bootstrap Error:", profileError);
                        showAlert(
                            "Profile Setup Warning",
                            `${profileError.message}\n\nYour account was created, but the profile row could not be saved. Check profiles INSERT/UPSERT RLS policy.`
                        );
                    }
                }

                console.log("Navigating user to dashboard...");
                router.replace('/(tabs)/dashboard');
            } else {
                console.warn("Authentication succeeded, but no valid session was returned.");
            }
        } catch (err: any) {
            console.error("Unexpected Login Error Caught:", err);
            showAlert("Unexpected Error", err.message || "An unexpected error occurred during sign-in.");
        } finally {
            setLoading(false);
            console.log("--- Login Attempt Complete ---");
        }
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <Text style={styles.title}>Welcome Back</Text>

            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
            />

            <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={true}
            />

            <Button
                label={loading ? "Logging in..." : "Login"}
                onPress={signInWithEmail}
            />

            <Link href="/signup" asChild>
                <Pressable style={{ marginTop: 20 }}>
                    <Text style={styles.linkText}>Don&apos;t have an account? Sign Up</Text>
                </Pressable>
            </Link>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
    input: { borderWidth: 1, borderColor: '#ccc', padding: 15, borderRadius: 8, marginBottom: 15 },
    linkText: { color: '#007AFF', textAlign: 'center', fontWeight: '600' }
});
