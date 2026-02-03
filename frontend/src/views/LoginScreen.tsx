
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
    const [role, setRole] = useState<UserRole>(UserRole.JOB_SEEKER);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Handlers
    const handleSendOTP = async () => {
        setErrorMsg(null); // Clear prev errors
        if (!identifier.trim() || identifier.length < 3) {
            setErrorMsg("Please enter a valid email or phone number.");
            return;
        }

        setIsLoading(true);
        try {
            await login(identifier.trim());
            setStep('OTP');
        } catch (error: any) {
            console.error("Login Error:", error);
            setErrorMsg(error.message || "Couldn't connect. Please check your internet.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify = async () => {
        setErrorMsg(null);
        if (!otp.trim() || otp.length < 4) {
            setErrorMsg("Please enter the 6-digit code.");
            return;
        }

        setIsLoading(true);
        try {
            const success = await verifyOtp(identifier.trim(), otp.trim(), role);
            if (!success) {
                setErrorMsg("Code didn't work. Try again?");
            }
            // Success! App.tsx handles navigation.
        } catch (error: any) {
            console.error("Verification Error:", error);
            setErrorMsg("Code didn't work. Try again?");
            setOtp('');
        } finally {
            setIsLoading(false);
        }
    };

    // =========================================================================
    // RENDER
    // =========================================================================

    // =========================================================================
    // RENDER
    // =========================================================================

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

            {/* BRANDING */}
            <View style={styles.header}>
                <View style={styles.logoBadge}>
                    <IconSparkles size={32} color="white" />
                </View>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Let's get you signed in.</Text>
            </View>

            {/* MAIN CARD */}
            <View style={styles.formContainer}>

                {/* ROLE SWITCHER */}
                {step === 'INPUT' && (
                    <View style={styles.roleSwitcher}>
                        <TouchableOpacity
                            style={[styles.roleBtn, role === UserRole.JOB_SEEKER && styles.roleBtnActive]}
                            onPress={() => setRole(UserRole.JOB_SEEKER)}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.roleText, role === UserRole.JOB_SEEKER && styles.roleTextActive]}>
                                Job Seeker
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.roleBtn, role === UserRole.EMPLOYER && styles.roleBtnActive]}
                            onPress={() => setRole(UserRole.EMPLOYER)}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.roleText, role === UserRole.EMPLOYER && styles.roleTextActive]}>
                                Employer
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* FORM INPUTS */}
                {step === 'INPUT' ? (
                    <>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email or Phone</Text>
                            <TextInput
                                style={[styles.input, errorMsg ? styles.inputError : null]}
                                placeholder="name@example.com"
                                placeholderTextColor="#94a3b8"
                                value={identifier}
                                onChangeText={(t) => {
                                    setIdentifier(t);
                                    if (errorMsg) setErrorMsg(null);
                                }}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                autoCorrect={false}
                            />
                        </View>

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
                            <Text style={styles.otpTitle}>Verify it's you</Text>
                            <Text style={styles.otpSubtext}>Code sent to {identifier}</Text>
                        </View>

                        <TextInput
                            style={[styles.otpInput, errorMsg ? styles.otpInputError : null]}
                            placeholder="123456"
                            placeholderTextColor="#cbd5e1"
                            value={otp}
                            onChangeText={(t) => {
                                setOtp(t);
                                if (errorMsg) setErrorMsg(null);
                            }}
                            keyboardType="number-pad"
                            maxLength={6}
                            autoFocus
                        />

                        {__DEV__ && (
                            <Text style={styles.devHint}>Dev Tip: Use '123456'</Text>
                        )}

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
                            onPress={() => { setStep('INPUT'); setOtp(''); setErrorMsg(null); }}
                            style={styles.backLink}
                        >
                            <Text style={styles.backLinkText}>Wrong number?</Text>
                        </TouchableOpacity>
                    </>
                )}

                {/* INLINE ERROR MESSAGE */}
                {errorMsg && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{errorMsg}</Text>
                    </View>
                )}
            </View>

            <Text style={styles.footer}>
                Your data is safe with us.
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
        backgroundColor: '#ffffff', // Clean White
        padding: 24,
        paddingTop: 60
    },
    header: {
        alignItems: 'center',
        marginBottom: 40
    },
    logoBadge: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: '#7c3aed',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 6
    },
    title: {
        fontSize: 32, // Increased from 28 for impact (Founder Directive)
        fontWeight: '900',
        color: '#0f172a', // Slate-950
        letterSpacing: -1, // Tighter tracking
        marginBottom: 8
    },
    subtitle: {
        fontSize: 16,
        color: '#64748b', // Slate-500
        textAlign: 'center',
        lineHeight: 24 // Better readability
    },

    formContainer: {
        width: '100%'
    },

    // Role Switcher (Segmented Control)
    roleSwitcher: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9', // Slate-100
        borderRadius: 12,
        padding: 4,
        marginBottom: 32
    },
    roleBtn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 10
    },
    roleBtnActive: {
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2
    },
    roleText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b'
    },
    roleTextActive: {
        color: '#0f172a' // Slate-900
    },

    inputGroup: {
        marginBottom: 24
    },
    label: {
        fontSize: 13, // Slightly smaller, more refined
        fontWeight: '600', // Reduced from 700
        color: '#475569', // Slate-600
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    input: {
        backgroundColor: '#f8fafc', // Slate-50
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#0f172a',
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },

    // OTP Styles
    otpHeader: {
        alignItems: 'center',
        marginBottom: 32
    },
    otpTitle: {
        fontSize: 20,
        fontWeight: '800', // Slightly reduced from bold default
        color: '#0f172a',
        marginBottom: 4
    },
    otpSubtext: {
        color: '#64748b',
        fontSize: 15
    },
    otpInput: {
        fontSize: 32,
        fontWeight: '900', // Max boldness for the code
        letterSpacing: 8,
        textAlign: 'center',
        color: '#7c3aed',
        marginBottom: 32,
        borderBottomWidth: 2,
        borderBottomColor: '#e2e8f0',
        paddingBottom: 8
    },

    mainBtn: {
        backgroundColor: '#7c3aed', // Violet-600
        paddingVertical: 18, // Taller button
        borderRadius: 16, // Softer corners
        alignItems: 'center',
        shadowColor: '#7c3aed',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 }
    },
    mainBtnText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16
    },

    backLink: {
        marginTop: 24,
        alignSelf: 'center',
        padding: 8
    },
    backLinkText: {
        color: '#64748b',
        fontSize: 14,
        fontWeight: '500' // Lighter weight
    },

    devHint: {
        textAlign: 'center',
        color: '#16a34a',
        fontSize: 12,
        marginBottom: 16,
        backgroundColor: '#dcfce7',
        padding: 4,
        borderRadius: 4,
        overflow: 'hidden',
        alignSelf: 'center'
    },

    footer: {
        position: 'absolute',
        bottom: 40,
        alignSelf: 'center',
        color: '#94a3b8',
        fontSize: 13,
        fontWeight: '500'
    },
    inputError: {
        borderColor: '#ef4444',
        backgroundColor: '#fef2f2'
    },
    otpInputError: {
        borderBottomColor: '#ef4444',
        color: '#ef4444'
    },
    errorContainer: {
        marginTop: 16,
        padding: 12,
        backgroundColor: '#fef2f2',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#fee2e2',
        alignItems: 'center'
    },
    errorText: {
        color: '#b91c1c',
        fontSize: 14,
        fontWeight: '500'
    }
});

export default LoginScreen;