import React, { useContext, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    Switch,
    Image,
    ActivityIndicator
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { AuthAPI } from '../services/api';
import {
    IconArrowRight,
    IconUser,
    IconLock,
    IconBell,
    IconGlobe,
    IconFileText,
    IconLogOut,
    IconTrash
} from '../components/Icons';

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

const SectionHeader = ({ title }: { title: string }) => (
    <Text style={styles.sectionTitle}>{title}</Text>
);

const SettingItem = ({
    label,
    value,
    icon: Icon,
    onPress,
    isDestructive = false,
    hasToggle = false
}: any) => (
    <TouchableOpacity
        style={[styles.item, isDestructive && styles.itemDestructive]}
        onPress={hasToggle ? undefined : onPress}
        activeOpacity={hasToggle ? 1 : 0.7}
    >
        <View style={styles.itemLeft}>
            <View style={[styles.iconBox, isDestructive && styles.iconBoxDestructive]}>
                <Icon size={18} color={isDestructive ? '#ef4444' : '#64748b'} />
            </View>
            <Text style={[styles.itemLabel, isDestructive && styles.labelDestructive]}>
                {label}
            </Text>
        </View>

        <View style={styles.itemRight}>
            {hasToggle ? (
                <Switch
                    value={true} // Mock state for UI demo
                    trackColor={{ false: "#e2e8f0", true: "#dcfce7" }}
                    thumbColor={"#10b981"}
                />
            ) : (
                <>
                    <Text style={styles.itemValue}>{value}</Text>
                    {onPress && <IconArrowRight size={16} color="#cbd5e1" />}
                </>
            )}
        </View>
    </TouchableOpacity>
);

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function SettingsScreen({ navigation }: any) {
    const { logout, userInfo } = useContext(AuthContext);
    const [isLoading, setIsLoading] = useState(false);

    // Handlers
    const handleLogout = () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                        // AuthContext update will trigger nav switch automatically
                        // But strictly safe reset:
                        navigation.reset({ index: 0, routes: [{ name: 'RoleSelect' }] });
                    }
                }
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'This action is permanent. All your data, applications, and chat history will be erased immediately.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete Permanently',
                    style: 'destructive',
                    onPress: performDelete
                }
            ]
        );
    };

    const performDelete = async () => {
        setIsLoading(true);
        try {
            await AuthAPI.deleteAccount(); // Use API service abstraction
            await logout();
            navigation.reset({ index: 0, routes: [{ name: 'RoleSelect' }] });
        } catch (e) {
            Alert.alert('Error', 'Failed to delete account. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.profileRow}>
                    <Image
                        source={{ uri: userInfo?.avatar || `https://ui-avatars.com/api/?name=${userInfo?.name || 'User'}&background=7c3aed&color=fff` }}
                        style={styles.avatar}
                    />
                    <View>
                        <Text style={styles.userName}>{userInfo?.name || 'User'}</Text>
                        <Text style={styles.userHandle}>{userInfo?.identifier || 'Guest'}</Text>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{userInfo?.role === 'employer' ? 'Employer Account' : 'Job Seeker'}</Text>
                        </View>
                    </View>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Section: Account */}
                <SectionHeader title="Account" />
                <View style={styles.sectionCard}>
                    <SettingItem
                        label="Profile Information"
                        value="Edit"
                        icon={IconUser}
                        onPress={() => navigation.navigate('Profiles')}
                    />
                    <View style={styles.divider} />
                    <SettingItem
                        label="Security"
                        value="Password & Auth"
                        icon={IconLock}
                        onPress={() => { }}
                    />
                </View>

                {/* Section: App */}
                <SectionHeader title="Preferences" />
                <View style={styles.sectionCard}>
                    <SettingItem
                        label="Notifications"
                        hasToggle
                        icon={IconBell}
                    />
                    <View style={styles.divider} />
                    <SettingItem
                        label="Language"
                        value="English (US)"
                        icon={IconGlobe}
                        onPress={() => { }}
                    />
                </View>

                {/* Section: Legal */}
                <SectionHeader title="Legal & Support" />
                <View style={styles.sectionCard}>
                    <SettingItem
                        label="Privacy Policy"
                        icon={IconFileText}
                        onPress={() => { }}
                    />
                    <View style={styles.divider} />
                    <SettingItem
                        label="Terms of Service"
                        icon={IconFileText}
                        onPress={() => { }}
                    />
                </View>

                {/* Section: Danger Zone */}
                <SectionHeader title="Actions" />
                <View style={[styles.sectionCard, styles.dangerCard]}>
                    <SettingItem
                        label="Sign Out"
                        icon={IconLogOut}
                        onPress={handleLogout}
                    />
                    <View style={styles.divider} />
                    {isLoading ? (
                        <ActivityIndicator style={{ padding: 16 }} color="#ef4444" />
                    ) : (
                        <SettingItem
                            label="Delete Account"
                            icon={IconTrash}
                            isDestructive
                            onPress={handleDeleteAccount}
                        />
                    )}
                </View>

                <Text style={styles.versionText}>HireCircle v1.0.0 (Build 2024.1)</Text>
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc', // Slate-50
    },

    // Header
    header: {
        backgroundColor: 'white',
        paddingHorizontal: 24,
        paddingTop: 60, // Safe Area
        paddingBottom: 24,
        borderBottomWidth: 1,
        borderColor: '#f1f5f9',
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    userName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    userHandle: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 4,
    },
    badge: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#475569',
    },

    // Content
    content: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
        marginTop: 16,
        marginLeft: 4,
    },
    sectionCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        overflow: 'hidden',
    },
    dangerCard: {
        borderColor: '#fecaca',
        backgroundColor: '#fef2f2',
    },

    // Setting Item
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: 'white',
    },
    itemDestructive: {
        backgroundColor: '#fef2f2',
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconBox: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconBoxDestructive: {
        backgroundColor: '#fee2e2',
    },
    itemLabel: {
        fontSize: 15,
        fontWeight: '500',
        color: '#334155',
    },
    labelDestructive: {
        color: '#ef4444',
        fontWeight: '600',
    },
    itemRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    itemValue: {
        fontSize: 14,
        color: '#94a3b8',
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginLeft: 60, // Align with text
    },

    // Footer
    versionText: {
        textAlign: 'center',
        fontSize: 12,
        color: '#cbd5e1',
        marginTop: 32,
    },
});