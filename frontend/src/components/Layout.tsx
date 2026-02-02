import React from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView, Platform, StatusBar } from 'react-native';
import {
    IconBriefcase,
    IconMessageSquare,
    IconUsers,
    IconSettings,
    IconGlobe,
    IconVideo,
    IconPlus
} from './Icons';
import { UserRole } from '../types';

// =============================================================================
// TYPES
// =============================================================================

export type TabId = 'profiles' | 'connect' | 'jobs' | 'applications' | 'settings';

interface LayoutProps {
    children: React.ReactNode;
    activeTab: string;
    onTabChange: (tab: TabId) => void;
    role: UserRole;
    onFabPress: () => void; // Generic handler
    showFab?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

const Layout: React.FC<LayoutProps> = ({
    children,
    activeTab,
    onTabChange,
    role,
    onFabPress,
    showFab = true
}) => {

    // Dynamic Tabs based on Role
    const tabs: { id: TabId; icon: any; label: string }[] = [
        {
            id: 'profiles',
            icon: IconUsers,
            label: role === UserRole.EMPLOYEE ? 'My Profile' : 'Candidates'
        },
        {
            id: 'jobs',
            icon: IconBriefcase,
            label: 'Jobs'
        },
        {
            id: 'connect',
            icon: IconMessageSquare,
            label: 'Chat'
        },
        {
            id: 'applications',
            icon: IconGlobe,
            label: 'Activity'
        },
        {
            id: 'settings',
            icon: IconSettings,
            label: 'Settings'
        },
    ];

    // Dynamic FAB Icon
    const FabIcon = role === UserRole.EMPLOYEE ? IconVideo : IconPlus;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

            {/* Main Content Area */}
            <View style={styles.content}>
                {children}
            </View>

            {/* Floating Action Button (Context Sensitive) */}
            {showFab && (
                <View style={styles.fabContainer}>
                    <Pressable
                        onPress={onFabPress}
                        style={({ pressed }) => [
                            styles.fab,
                            pressed && styles.fabPressed
                        ]}
                    >
                        {/* Candidate -> Video Icon (Interview) 
                           Employer -> Plus Icon (Post Job)
                        */}
                        <FabIcon size={28} color="white" strokeWidth={2.5} />
                    </Pressable>
                </View>
            )}

            {/* Bottom Navigation Bar */}
            <View style={styles.navBar}>
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;

                    return (
                        <Pressable
                            key={tab.id}
                            onPress={() => onTabChange(tab.id)}
                            style={styles.navItem}
                            hitSlop={10} // Easier to tap
                        >
                            <View style={[styles.iconWrapper, isActive && styles.iconWrapperActive]}>
                                <Icon
                                    size={24}
                                    color={isActive ? '#7c3aed' : '#94a3b8'}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                            </View>
                            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                                {tab.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </SafeAreaView>
    );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc', // Slate-50 background
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    content: {
        flex: 1,
        zIndex: 1,
    },
    fabContainer: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 100 : 90, // Position above TabBar
        right: 20,
        zIndex: 100, // Ensure it floats above content
    },
    fab: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#7c3aed', // Primary Purple
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8, // Android shadow
    },
    fabPressed: {
        transform: [{ scale: 0.92 }],
        backgroundColor: '#6d28d9',
    },
    navBar: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingBottom: Platform.OS === 'ios' ? 0 : 12,
        paddingTop: 12,
        height: Platform.OS === 'ios' ? 85 : 70,
        justifyContent: 'space-around',
        alignItems: 'flex-start',
        elevation: 20, // Shadow for Android
        shadowColor: '#000', // Shadow for iOS
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    navItem: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 60,
    },
    iconWrapper: {
        marginBottom: 4,
    },
    iconWrapperActive: {
        transform: [{ scale: 1.1 }], // Subtle pop effect
    },
    navLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#94a3b8',
    },
    navLabelActive: {
        color: '#7c3aed',
        fontWeight: '700',
    },
});

export default Layout;