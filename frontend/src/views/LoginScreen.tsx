
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StatusBar
} from 'react-native';
import { UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import { IconBriefcase, IconUsers, IconSparkles, IconCheck } from '../components/Icons';

// =============================================================================
// COMPONENT
// =============================================================================

const LoginScreen: React.FC = () => {
    const { login, verifyOtp } = useAuth();

    // State
    const [step, setStep] = useState<'INPUT' | 'OTP'>('INPUT');
    const [identifier, setIdentifier] = useState(''); // Email or Phone
    const [otp, setOtp] = useState('');
    const [role, setRole] = useState<UserRole>(UserRole.EMPLOYEE); // Default to Candidate
    const [isLoading, setIsLoading] = useState(false);

    // Handlers
    const handleSendOTP = async () => {
        if (!identifier.trim() || identifier.length < 3) {
            Alert.alert("Invalid Input", "Please enter a valid email or phone number.");
            return;
        }

        setIsLoading(true);
        try {
            await login(identifier.trim());
            setStep('OTP');

            // UX: Focus helper or Toast could go here
            if (__DEV__) {

            }
        } catch (error: any) {
            console.error("Login Error:", error);
            const msg = error.message || "Could not connect to server.";
            Alert.alert("Connection Failed", msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify = async () => {
        if (!otp.trim() || otp.length < 4) {
            Alert.alert("Invalid Code", "Please enter the 6-digit code.");
            return;
        }

        setIsLoading(true);
        try {
            // Context handles API + State Update
            const success = await verifyOtp(identifier.trim(), otp.trim(), role);

            if (!success) {
                // AuthContext usually warns internally, but we warn UI too
                throw new Error("Invalid OTP or session expired.");
            }

            // Success! No need to navigate manually; 
            // App.tsx watches userToken and switches stack automatically.

        } catch (error: any) {
            console.error("Verification Error:", error);
            Alert.alert("Login Failed", "Invalid OTP or session expired.");
            setOtp(''); // Clear for retry
        } finally {
            setIsLoading(false);
        }
    };

    // =========================================================================
    // RENDER
    // =========================================================================

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <StatusBar barStyle="light-content" backgroundColor="#7c3aed" />

            {/* BRANDING */}
            <View style={styles.hero}>
                <View style={styles.iconCircle}>
                    <IconSparkles size={40} color="white" />
                </View>
                <Text style={styles.title}>Hire App</Text>
                <Text style={styles.subtitle}>The Future of Frontline Hiring</Text>
            </View>

            {/* MAIN CARD */}
            <View style={styles.card}>

                {/* ROLE SWITCHER (Only visible in Step 1) */}
                {step === 'INPUT' && (
                    <View style={styles.roleSwitcher}>
                        <TouchableOpacity
                            style={[styles.roleBtn, role === UserRole.EMPLOYEE && styles.roleBtnActive]}
                            onPress={() => setRole(UserRole.EMPLOYEE)}
                            activeOpacity={0.8}
                        >
                            <IconUsers size={18} color={role === UserRole.EMPLOYEE ? 'white' : '#64748b'} />
                            <Text style={[styles.roleText, role === UserRole.EMPLOYEE && styles.roleTextActive]}>
                                Job Seeker
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.roleBtn, role === UserRole.EMPLOYER && styles.roleBtnActive]}
                            onPress={() => setRole(UserRole.EMPLOYER)}
                            activeOpacity={0.8}
                        >
                            <IconBriefcase size={18} color={role === UserRole.EMPLOYER ? 'white' : '#64748b'} />
                            <Text style={[styles.roleText, role === UserRole.EMPLOYER && styles.roleTextActive]}>
                                Employer
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* FORM INPUTS */}
                {step === 'INPUT' ? (
                    <>
                        <Text style={styles.label}>
                            {role === UserRole.EMPLOYEE ? 'Find your next job' : 'Hire top talent'}
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Email or Mobile Number"
                            placeholderTextColor="#94a3b8"
                            value={identifier}
                            onChangeText={setIdentifier}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            autoCorrect={false}
                        />
                        <TouchableOpacity
                            style={styles.mainBtn}
                            onPress={handleSendOTP}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.mainBtnText}>Continue</Text>
                            )}
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <View style={styles.otpHeader}>
                            <Text style={styles.label}>Verify your identity</Text>
                            <Text style={styles.otpSubtext}>Code sent to {identifier}</Text>
                        </View>

                        <TextInput
                            style={[styles.input, styles.otpInput]}
                            placeholder="123456"
                            placeholderTextColor="#cbd5e1"
                            value={otp}
                            onChangeText={setOtp}
                            keyboardType="number-pad"
                            maxLength={6}
                            autoFocus
                        />

                        {__DEV__ && <Text style={styles.devHint}>Dev Tip: Use '123456'</Text>}

                        <TouchableOpacity
                            style={styles.mainBtn}
                            onPress={handleVerify}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.mainBtnText}>Verify & Login</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => { setStep('INPUT'); setOtp(''); }}
                            style={styles.backLink}
                        >
                            <Text style={styles.backLinkText}>Change Number</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>

            <Text style={styles.footer}>
                By continuing, you agree to our Terms & Privacy Policy.
            </Text>
        </KeyboardAvoidingView>
    );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#7c3aed',
        justifyContent: 'center',
        padding: 24
    },
    hero: {
        alignItems: 'center',
        marginBottom: 40
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)'
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: 'white',
        letterSpacing: -0.5
    },
    subtitle: {
        fontSize: 16,
        color: '#e9d5ff',
        marginTop: 8,
        fontWeight: '500'
    },

    card: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 25,
        shadowOffset: { width: 0, height: 10 },
        elevation: 10
    },

    roleSwitcher: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        borderRadius: 14,
        padding: 4,
        marginBottom: 24
    },
    roleBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 12,
        borderRadius: 10
    },
    roleBtnActive: {
        backgroundColor: '#0f172a',
        shadowColor: 'black',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2
    },
    roleText: {
        fontWeight: '600',
        color: '#64748b',
        fontSize: 14
    },
    roleTextActive: {
        color: 'white'
    },

    otpHeader: { marginBottom: 16 },
    otpSubtext: { color: '#64748b', fontSize: 13, marginTop: 4 },

    label: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 12
    },
    input: {
        backgroundColor: '#f8fafc',
        borderRadius: 14,
        padding: 16,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 24,
        color: '#0f172a'
    },
    otpInput: {
        fontSize: 24,
        letterSpacing: 8,
        textAlign: 'center',
        fontWeight: 'bold'
    },
    mainBtn: {
        backgroundColor: '#7c3aed',
        padding: 16,
        borderRadius: 14,
        alignItems: 'center',
        shadowColor: '#7c3aed',
        shadowOpacity: 0.4,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 }
    },
    mainBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16
    },

    backLink: { marginTop: 20, alignSelf: 'center', padding: 8 },
    backLinkText: { color: '#64748b', fontSize: 14, fontWeight: '500' },

    devHint: {
        textAlign: 'center',
        color: '#16a34a',
        fontSize: 12,
        marginBottom: 16,
        backgroundColor: '#dcfce7',
        padding: 4,
        borderRadius: 4,
        overflow: 'hidden'
    },

    footer: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        textAlign: 'center',
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12
    }
});

export default LoginScreen;