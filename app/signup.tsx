import React, { useState } from 'react';
import { Alert, TextInput, Text, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../utils/supabase';
import { Link, useRouter } from 'expo-router';
import { ensureProfileRow } from '../lib/profiles';

export default function SignUp() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
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

    async function signUpWithEmail() {
        console.log("--- Sign Up Attempt Started ---");
        console.log("Payload - Username:", username, "Email:", email);

        if (!username.trim() || !email.trim() || !password) {
            showAlert("Missing Fields", "Please enter a username, email, and password.");
            return;
        }

        if (password.length < 6) {
            showAlert("Weak Password", "Password must be at least 6 characters.");
            return;
        }

        if (!supabase) {
            showAlert("Configuration Error", "Supabase client is not initialized.");
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        username: username, // Sent to user metadata
                    }
                }
            });

            if (error) {
                console.error("Supabase Registration Error:", error);
                const code = (error as any)?.code ? `\nCode: ${(error as any).code}` : '';
                showAlert("Sign Up Error", `${error.message}${code}`);
                return;
            }

            console.log("Supabase Registration Successful. Auth payload:", data);

            // If Supabase is configured with "Confirm Email" ON:
            if (data.session === null) {
                showAlert("Confirm Email", "Please click the confirmation link sent to your email to complete registration.");
                router.replace('/login');
            } else {
                if (data.user) {
                    const { error: profileError } = await ensureProfileRow({
                        userId: data.user.id,
                        email: data.user.email,
                        username: username,
                    });

                    if (profileError) {
                        console.error("Profile Bootstrap Error:", profileError);
                        showAlert(
                            "Profile Setup Warning",
                            `${profileError.message}\n\nYour auth user was created, but the profile row could not be saved. Check profiles INSERT/UPSERT RLS policy.`
                        );
                    }
                }

                console.log("Direct session found. Accessing dashboard...");
                router.replace('/(tabs)/dashboard');
            }
        } catch (err: any) {
            console.error("Unexpected Sign Up Error Caught:", err);
            showAlert("Unexpected Error", err.message || "An unexpected error occurred during account creation.");
        } finally {
            setLoading(false);
            console.log("--- Sign Up Attempt Complete ---");
        }
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <Text style={styles.title}>Create Account</Text>

            <TextInput
                style={styles.input}
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
            />

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

            <Pressable
                style={[styles.button, loading && { backgroundColor: '#cccccc' }]}
                onPress={signUpWithEmail}
                disabled={loading}
            >
                {loading ? (
                    <Text style={styles.buttonText}>Creating Account...</Text>
                ) : (
                    <Text style={styles.buttonText}>Sign Up</Text>
                )}
            </Pressable>

            <Link href="/login" asChild>
                <Pressable style={{ marginTop: 20 }}>
                    <Text style={{ color: '#007AFF', textAlign: 'center' }}>
                        Already have an account? Log In
                    </Text>
                </Pressable>
            </Link>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    input: { borderWidth: 1, borderColor: '#ccc', padding: 15, borderRadius: 8, marginBottom: 15 },
    button: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center' },
    buttonText: { color: '#fff', fontWeight: 'bold' }
});
