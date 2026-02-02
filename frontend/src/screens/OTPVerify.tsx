import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { AuthAPI } from '../services/api';
import { IconArrowLeft } from '../components/Icons';

export default function OTPScreen({ route, navigation }: any) {
    const { identifier, role = 'candidate' } = route.params || {};
    const { verifyOtp } = useContext(AuthContext);

    // State
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [timer, setTimer] = useState(30);

    // Countdown Timer for Resend
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleVerify = async () => {
        if (!otp.trim() || otp.length < 6) {
            Alert.alert("Invalid OTP", "Please enter the full 6-digit code.");
            return;
        }

        setIsLoading(true);
        try {
            const success = await verifyOtp(identifier, otp, role);
            if (!success) {
                Alert.alert("Verification Failed", "Invalid code or expired session.");
                setOtp('');
            }
            // Success is handled by AuthContext changing the userToken state
        } catch (error) {
            Alert.alert("Error", "Something went wrong.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (timer > 0) return;

        try {
            await AuthAPI.sendOTP(identifier);
            setTimer(30);
            Alert.alert("Sent", "A new code has been sent.");
        } catch (e) {
            Alert.alert("Error", "Could not resend code.");
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <IconArrowLeft size={24} color="#0f172a" />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <Text style={styles.title}>Verify Identity</Text>
                <Text style={styles.subtitle}>
                    We sent a code to <Text style={styles.bold}>{identifier}</Text>
                </Text>

                <TextInput
                    style={styles.otpInput}
                    value={otp}
                    onChangeText={setOtp}
                    placeholder="• • • • • •"
                    placeholderTextColor="#cbd5e1"
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                />

                <TouchableOpacity
                    style={styles.verifyBtn}
                    onPress={handleVerify}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.verifyBtnText}>Verify Code</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleResend}
                    disabled={timer > 0}
                    style={styles.resendBtn}
                >
                    <Text style={[styles.resendText, timer > 0 && styles.resendDisabled]}>
                        {timer > 0 ? `Resend code in ${timer}s` : "Resend Code"}
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        padding: 24,
    },
    header: {
        marginTop: 40,
        marginBottom: 24,
    },
    backBtn: {
        padding: 8,
        marginLeft: -8,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingBottom: 100, // Visual center
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: '#0f172a',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748b',
        marginBottom: 40,
    },
    bold: {
        fontWeight: 'bold',
        color: '#0f172a',
    },
    otpInput: {
        fontSize: 32,
        fontWeight: 'bold',
        letterSpacing: 8,
        textAlign: 'center',
        color: '#7c3aed',
        borderBottomWidth: 2,
        borderBottomColor: '#e2e8f0',
        paddingBottom: 8,
        marginBottom: 40,
    },
    verifyBtn: {
        backgroundColor: '#7c3aed',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
        marginBottom: 24,
    },
    verifyBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    resendBtn: {
        alignItems: 'center',
        padding: 8,
    },
    resendText: {
        color: '#7c3aed',
        fontWeight: '600',
        fontSize: 14,
    },
    resendDisabled: {
        color: '#94a3b8',
    },
});