import { View, StyleSheet } from 'react-native';
import { Link, Stack } from 'expo-router';

export default function NotFoundScreen(){
    return(
        <>
            <Stack.Screen options={{ title: 'Page not found'}}/>
            <View style={styles.container}>
                <Link href="/dashboard" style={styles.button}>
                Back to Home Screen
                </Link>
            </View>
        
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex:1,
        backgroundColor: '#25292e',
        justifyContent: 'center',
        alignItems: 'center',
    },
    button: {
        fontSize: 20,
        textDecorationLine: 'underline',
        color: '#fff',
    },
});