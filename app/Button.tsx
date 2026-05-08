import { Text, Pressable, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors } from '../commonStyles'; // Adjust path if needed

interface ButtonProps {
    label: string;
    onPress?: () => void; // The '?' means it's optional
    style?: StyleProp<ViewStyle>; // Allows you to pass custom styles like the red background
}

export default function Button({ label, onPress, style }: ButtonProps) {
    const theme = colors['light'];

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.button,
                { backgroundColor: theme.accent }, // Your default theme color
                style, // This allows the 'Red' background to override the default
                pressed && { opacity: 0.8 }
            ]}
        >
            <Text style={styles.text}>{label}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    text: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});