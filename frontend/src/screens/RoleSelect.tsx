import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    Dimensions,
    Platform
} from 'react-native';
import { UserRole } from '../types';
import { IconUsers, IconBriefcase, IconSparkles } from '../components/Icons';

// =============================================================================
// COMPONENT
// =============================================================================

export default function RoleSelectScreen({ navigation }: any) {

    const handleSelectRole = (role: UserRole) => {
        // Navigate to Login, pre-selecting the role in the toggle
        navigation.navigate('Login', { role });
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

            {/* Header Section */}
            <View style={styles.header}>
                <View style={styles.logoBadge}>
                    <IconSparkles size={32} color="#7c3aed" />
                </View>
                <Text style={styles.title}>Welcome to Hire App</Text>
                <Text style={styles.subtitle}>
                    The smartest way to hire and get hired.
                </Text>
            </View>

            {/* Selection Cards */}
            <View style={styles.content}>
                <Text style={styles.sectionLabel}>CHOOSE YOUR ACCOUNT TYPE</Text>

                {/* Option 1: Job Seeker */}
                <TouchableOpacity
                    style={[styles.card, styles.cardSeeker]}
                    activeOpacity={0.9}
                    onPress={() => handleSelectRole(UserRole.JOB_SEEKER)}
                >
                    <View style={styles.iconCircleSeeker}>
                        <IconUsers size={32} color="#0f172a" />
                    </View>
                    <View style={styles.cardText}>
                        <Text style={styles.cardTitle}>I'm a Job Seeker</Text>
                        <Text style={styles.cardDesc}>
                            Find blue-collar & frontline jobs nearby. Apply with one tap.
                        </Text>
                    </View>
                </TouchableOpacity>

                {/* Option 2: Employer */}
                <TouchableOpacity
                    style={[styles.card, styles.cardEmployer]}
                    activeOpacity={0.9}
                    onPress={() => handleSelectRole(UserRole.EMPLOYER)}
                >
                    <View style={styles.iconCircleEmployer}>
                        <IconBriefcase size={32} color="#7c3aed" />
                    </View>
                    <View style={styles.cardText}>
                        <Text style={styles.cardTitle}>
                            I'm an Employer
                        </Text>
                        <Text style={styles.cardDesc}>
                            Post jobs, manage pools, and hire verified staff instantly.
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    By continuing, you agree to our Terms of Service and Privacy Policy.
                </Text>
            </View>
        </View>
    );
}

// =============================================================================
// STYLES
// =============================================================================

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc', // Slate-50 main bg
        padding: 24
    },

    // Header
    header: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 40
    },
    logoBadge: {
        width: 72,
        height: 72,
        borderRadius: 24,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 4
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#020617', // Slate-950
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: -0.5
    },
    subtitle: {
        fontSize: 16,
        color: '#64748b', // Slate-600
        textAlign: 'center',
        maxWidth: width * 0.7,
        lineHeight: 24
    },

    // Content
    content: {
        flex: 2,
        justifyContent: 'center',
        gap: 20
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 8,
        textAlign: 'center'
    },

    // Cards (Unified Design)
    card: {
        width: '100%',
        padding: 24,
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
        backgroundColor: 'white',
        // Soft Light Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f1f5f9'
    },
    cardSeeker: {
        // No special override needed for seeker
    },
    cardEmployer: {
        // Removed dark background. Unified.
    },

    // Icons inside cards
    iconCircleSeeker: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#f0f9ff', // Sky-50
        alignItems: 'center',
        justifyContent: 'center'
    },
    iconCircleEmployer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#fdf4ff', // Fuchsia-50
        alignItems: 'center',
        justifyContent: 'center'
    },

    // Text inside cards
    cardText: {
        flex: 1
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 6
    },
    cardDesc: {
        fontSize: 14,
        color: '#64748b',
        lineHeight: 20
    },

    // Footer
    footer: {
        paddingVertical: 20,
        alignItems: 'center'
    },
    footerText: {
        fontSize: 11,
        color: '#cbd5e1',
        textAlign: 'center',
        maxWidth: 280,
        lineHeight: 16
    }
});