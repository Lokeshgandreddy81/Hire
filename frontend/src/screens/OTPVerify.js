import React, { useState, useContext } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { AuthContext } from '../context/AuthContext';

export default function OTPScreen({ route, navigation }) {
    const { identifier, role = 'candidate' } = route.params;
    const [otp, setOtp] = useState('');
    const { verifyOtp } = useContext(AuthContext);

    const handleVerify = async () => {
        if (!otp.trim()) {
            Alert.alert("Error", "Please enter the OTP");
            return;
        }
        const success = await verifyOtp(identifier, otp, role);
        if (!success) {
            Alert.alert("Error", "Invalid OTP (Check backend logs for code)");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Verify OTP</Text>
            <Text>Sent to {identifier}</Text>
            <TextInput
                style={styles.input}
                value={otp}
                onChangeText={setOtp}
                placeholder="Enter OTP"
                keyboardType="numeric"
            />
            <Button title="Verify" onPress={handleVerify} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, justifyContent: 'center' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    input: { borderBottomWidth: 1, marginBottom: 20, padding: 10, fontSize: 16 }
});
