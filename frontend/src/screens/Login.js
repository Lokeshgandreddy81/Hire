import React, { useState, useContext } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { AuthContext } from '../context/AuthContext';

export default function LoginScreen({ navigation, route }) {
    const role = route?.params?.role || 'candidate';
    const [identifier, setIdentifier] = useState('');
    const { login } = useContext(AuthContext);

    const handleLogin = async () => {
        if (!identifier.trim()) {
            Alert.alert("Error", "Please enter your email or phone number");
            return;
        }
        const success = await login(identifier);
        if (success) {
            navigation.navigate('OTPVerify', { identifier, role });
        } else {
            Alert.alert("Error", "Could not send OTP");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome to Hire App</Text>
            <Text style={styles.label}>Email or Phone</Text>
            <TextInput
                style={styles.input}
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
            />
            <Button title="Get OTP" onPress={handleLogin} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, justifyContent: 'center' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    label: { marginBottom: 5 },
    input: { borderBottomWidth: 1, marginBottom: 20, padding: 10, fontSize: 16 }
});
