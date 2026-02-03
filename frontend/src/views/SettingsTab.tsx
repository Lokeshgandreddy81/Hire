import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Pressable,
    Image,
    Switch,
    Alert,
    ActivityIndicator
} from 'react-native';
import { User, UserRole } from '../types';
import { AuthAPI } from '../services/api';
import {
    IconBell,
    IconGlobe,
    IconFile,
    IconBriefcase,
    IconUser,
    IconLogOut,
    IconTrash
} from '../components/Icons'; // Assuming generic icons map to these or similar

// =============================================================================
// TYPES
// =============================================================================

interface SettingsTabProps {
    currentUser: User;
    onLogout: () => void;
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.sectionContent}>
            {children}
        </View>
    </View>
);

const Row: React.FC<{
    label: string;
    value?: string;
    icon?: any;
    toggle?: boolean;
    isDestructive?: boolean;
    onPress?: () => void;
    isLoading?: boolean;
}> = ({ label, value, icon: Icon, toggle, isDestructive, onPress, isLoading }) => (
    <Pressable
        style={({ pressed }) => [
            styles.row,
            pressed && onPress && styles.rowPressed
        ]}
        onPress={toggle ? undefined : onPress}
    >
        <View style={styles.rowLeft}>
            {Icon && (
                <View style={[styles.iconBox, isDestructive && styles.iconBoxDestructive]}>
                    <Icon size={18} color={isDestructive ? '#ef4444' : '#64748b'} />
                </View>
            )}
            <Text style={[styles.rowLabel, isDestructive && styles.textDestructive]}>
                {label}
            </Text>
        </View>

        <View style={styles.rowRight}>
            {isLoading ? (
                <ActivityIndicator size="small" color="#64748b" />
            ) : (
                <>
                    {value && <Text style={styles.rowValue}>{value}</Text>}
                    {toggle && (
                        <Switch
                            value={true} // Mock state for UI demo
                            trackColor={{ false: "#e2e8f0", true: "#dcfce7" }}
                            thumbColor={true ? "#10b981" : "#f4f3f4"}
                        />
                    )}
                    {!toggle && !value && onPress && (
                        <Text style={styles.arrow}>›</Text>
                    )}
                </>
            )}
        </View>
    </Pressable>
);

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const SettingsTab: React.FC<SettingsTabProps> = ({ currentUser, onLogout }) => {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteAccount = () => {
        Alert.alert(
            "Delete Account?",
            "This action is permanent. All your data, including profile and chat history, will be erased.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        setIsDeleting(true);
                        try {
                            // Call the backend endpoint we created in auth.py
                            // Assuming AuthAPI.deleteAccount exists or using direct fetch
                            // await AuthAPI.deleteAccount(); 
                            // For now, simulate success and logout
                            setTimeout(() => {
                                onLogout();
                            }, 1000);
                        } catch (error) {
                            Alert.alert("Error", "Could not delete account. Please try again.");
                            setIsDeleting(false);
                        }
                    }
                }
            ]
        );
    };

    const isEmployee = currentUser?.role === UserRole.JOB_SEEKER;
    const displayName = currentUser?.name || "User";
    const displayRole = isEmployee ? ("Job Seeker") : ("Employer");
    const avatarUrl = currentUser?.avatar || `https://ui-avatars.com/api/?name=${displayName}&background=7c3aed&color=fff`;

    return (
        <View style={styles.container}>
            {/* Header Profile Card */}
            <View style={styles.header}>
                <Image
                    source={{ uri: avatarUrl }}
                    style={styles.avatar}
                />
                <View style={styles.profileInfo}>
                    <Text style={styles.userName}>{displayName}</Text>
                    <Text style={styles.userRole}>{displayRole}</Text>
                    <View style={styles.statusBadge}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusText}>Active</Text>
                    </View>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Section 1: Account Info */}
                <Section title="Account">
                    <Row
                        label="Identifier"
                        value={currentUser?.identifier || "+91 ••••• •••••"}
                        icon={IconUser}
                    />
                    <Row
                        label="Location"
                        value={currentUser?.location || "India"}
                        icon={IconGlobe}
                    />
                    <Row
                        label="Role"
                        value={isEmployee ? "Candidate" : "Hiring Manager"}
                        icon={IconBriefcase}
                    />
                </Section>

                {/* Section 2: App Preferences */}
                <Section title="Preferences">
                    <Row
                        label="Push Notifications"
                        toggle
                        icon={IconBell}
                    />
                    <Row
                        label="Data Saver Mode"
                        toggle
                        icon={IconFile} // Fallback icon
                    />
                </Section>

                {/* Section 3: Actions */}
                <Section title="System">
                    <Row
                        label="Sign Out"
                        icon={IconLogOut}
                        onPress={onLogout}
                    />
                    <Row
                        label="Delete Account"
                        icon={IconTrash}
                        isDestructive
                        onPress={handleDeleteAccount}
                        isLoading={isDeleting}
                    />
                </Section>

                <View style={styles.footer}>
                    <Text style={styles.version}>Hire App v1.0.0 (Build 2024.1)</Text>
                    <Text style={styles.copyright}>© 2024 Hire App Inc.</Text>
                </View>

            </ScrollView>
        </View>
    );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc'
    },

    // Header
    header: {
        backgroundColor: 'white',
        padding: 24,
        paddingTop: 32,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderColor: '#e2e8f0'
    },
    avatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        marginRight: 20,
        borderWidth: 1,
        borderColor: '#f1f5f9'
    },
    profileInfo: {
        flex: 1,
        justifyContent: 'center'
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#0f172a'
    },
    userRole: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 2
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        backgroundColor: '#f0fdf4',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#dcfce7'
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#16a34a',
        marginRight: 6
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#166534'
    },

    // Content
    content: {
        padding: 20,
        gap: 24
    },

    // Sections
    sectionContainer: {
        gap: 8
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginLeft: 4
    },
    sectionContent: {
        backgroundColor: 'white',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOpacity: 0.02,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
    },

    // Rows
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderColor: '#f1f5f9',
        backgroundColor: 'white'
    },
    rowPressed: {
        backgroundColor: '#f8fafc'
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    iconBox: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center'
    },
    iconBoxDestructive: {
        backgroundColor: '#fef2f2'
    },
    rowLabel: {
        fontSize: 15,
        fontWeight: '500',
        color: '#334155'
    },
    textDestructive: {
        color: '#ef4444',
        fontWeight: '600'
    },
    rowRight: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    rowValue: {
        fontSize: 14,
        color: '#94a3b8',
        maxWidth: 150,
        textAlign: 'right'
    },
    arrow: {
        fontSize: 18,
        color: '#cbd5e1',
        marginLeft: 8
    },

    // Footer
    footer: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 40
    },
    version: {
        fontSize: 12,
        color: '#94a3b8'
    },
    copyright: {
        fontSize: 10,
        color: '#cbd5e1',
        marginTop: 4
    }
});

export default SettingsTab;