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
                    <IconSparkles size={32} color="white" />
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
                    onPress={() => handleSelectRole(UserRole.EMPLOYEE)}
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
                        <IconBriefcase size={32} color="white" />
                    </View>
                    <View style={styles.cardText}>
                        <Text style={[styles.cardTitle, { color: 'white' }]}>
                            I'm an Employer
                        </Text>
                        <Text style={[styles.cardDesc, { color: '#e2e8f0' }]}>
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
        backgroundColor: '#f8fafc', // Slate-50
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
        backgroundColor: '#7c3aed',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 10
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: '#0f172a',
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: -0.5
    },
    subtitle: {
        fontSize: 16,
        color: '#64748b',
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
        fontWeight: 'bold',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
        textAlign: 'center'
    },

    // Cards
    card: {
        width: '100%',
        padding: 24,
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)'
    },
    cardSeeker: {
        backgroundColor: 'white',
    },
    cardEmployer: {
        backgroundColor: '#0f172a', // Slate-900 (Dark branding for serious business)
    },

    // Icons inside cards
    iconCircleSeeker: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center'
    },
    iconCircleEmployer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center'
    },

    // Text inside cards
    cardText: {
        flex: 1
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 6
    },
    cardDesc: {
        fontSize: 13,
        color: '#64748b',
        lineHeight: 18
    },

    // Footer
    footer: {
        paddingVertical: 20,
        alignItems: 'center'
    },
    footerText: {
        fontSize: 11,
        color: '#94a3b8',
        textAlign: 'center',
        maxWidth: 280,
        lineHeight: 16
    }
});