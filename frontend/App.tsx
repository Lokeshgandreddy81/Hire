import 'react-native-gesture-handler'; // MUST BE FIRST

import React, { useState } from 'react';
import { View, ActivityIndicator, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Filter out benign console errors from React Native internals
const originalError = console.error;
console.error = (...args) => {
    if (
        typeof args[0] === 'string' &&
        (args[0].includes('Text strings must be rendered within a <Text> component') ||
            args[0].includes('SafeAreaView has been deprecated'))
    ) {
        return; // Suppress these specific errors
    }
    originalError(...args); // Log all other errors normally
};

// Auth
import { AuthProvider, useAuth } from './src/context/AuthContext';

// Screens
import LoginScreen from './src/views/LoginScreen';
import JobsTab from './src/views/JobsTab';
import ApplicationsTab from './src/views/ApplicationsTab';
import ProfilesTab from './src/views/ProfilesTab';
import SettingsTab from './src/views/SettingsTab';
import JobDetailScreen from './src/screens/JobDetail';
import ChatScreen from './src/screens/Chat';

// Components
import SmartInterview from './src/components/SmartInterview';
import {
    IconBriefcase,
    IconMessageSquare,
    IconUsers,
    IconSettings
} from './src/components/Icons';

// Types / APIs
import { UserRole } from './src/types';
import { ProfileAPI } from './src/services/api';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// =============================================================================
// MAIN TABS
// =============================================================================

function MainTabs({ onTriggerInterview }: { onTriggerInterview: () => void }) {
    const { userInfo, logout } = useAuth();
    const userRole = userInfo?.role;

    // Guard against null userInfo (should be handled by RootNavigator, but safe check)
    if (!userInfo || !userRole) return null;

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#7c3aed',
                tabBarInactiveTintColor: '#94a3b8',
                tabBarStyle: {
                    height: 60,
                    paddingBottom: 6,
                    backgroundColor: 'white',
                    borderTopWidth: 1,
                    borderTopColor: '#f1f5f9',
                    elevation: 0, // Android flat
                    shadowOpacity: 0 // iOS flat
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600'
                }
            }}
        >
            <Tab.Screen
                name="Profile"
                options={{
                    tabBarLabel:
                        userRole === UserRole.JOB_SEEKER ? 'Profile' : 'Talent',
                    tabBarIcon: ({ color }) => (
                        <IconUsers size={24} color={color} />
                    )
                }}
            >
                {props => (
                    <ProfilesTab
                        {...props}
                        currentUser={userInfo}
                        onTriggerInterview={onTriggerInterview}
                    />
                )}
            </Tab.Screen>

            <Tab.Screen
                name="Applications"
                component={ApplicationsTab}
                options={{
                    tabBarIcon: ({ color }) => (
                        <IconMessageSquare size={24} color={color} />
                    )
                }}
            />

            <Tab.Screen
                name="Jobs"
                component={JobsTab}
                options={{
                    tabBarIcon: ({ color }) => (
                        <IconBriefcase size={24} color={color} />
                    )
                }}
            />

            <Tab.Screen
                name="Settings"
                options={{
                    tabBarIcon: ({ color }) => (
                        <IconSettings size={24} color={color} />
                    )
                }}
            >
                {props => (
                    <SettingsTab
                        {...props}
                        currentUser={userInfo}
                        onLogout={logout}
                    />
                )}
            </Tab.Screen>
        </Tab.Navigator>
    );
}

// =============================================================================
// ROOT NAVIGATOR (Handles Auth & Modal Stack)
// =============================================================================

function RootNavigator() {
    const { userToken, userInfo, isLoading } = useAuth();
    const [showSmartInterview, setShowSmartInterview] = useState(false);

    const handleInterviewComplete = async (result: any) => {
        // Sub-components (ProfileCreationForm, JobCreationForm, VideoInterview)
        // handle the API calls internally. We just need to close the flow.
        if (result?.status === 'success') {
            // Optional: global toast or snackbar here
        }
        setShowSmartInterview(false);
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#7c3aed" />
            </View>
        );
    }

    return (
        <>
            <NavigationContainer>
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                    {!userToken || !userInfo ? (
                        <Stack.Screen name="Login" component={LoginScreen} />
                    ) : (
                        <>
                            <Stack.Screen name="MainTabs">
                                {props => (
                                    <MainTabs
                                        {...props}
                                        onTriggerInterview={() => setShowSmartInterview(true)}
                                    />
                                )}
                            </Stack.Screen>

                            {/* REGISTER ORPHANED SCREENS */}
                            <Stack.Screen name="JobDetail" component={JobDetailScreen} />
                            <Stack.Screen name="Chat" component={ChatScreen} />
                        </>
                    )}
                </Stack.Navigator>
            </NavigationContainer>

            {/* GLOBAL OVERLAYS */}
            {showSmartInterview && userInfo?.role && (
                <SmartInterview
                    role={userInfo.role}
                    onClose={() => setShowSmartInterview(false)}
                    onComplete={handleInterviewComplete}
                />
            )}

            <StatusBar style="auto" />
        </>
    );
}

// =============================================================================
// APP ENTRY POINT
// =============================================================================

export default function App() {
    console.log('🚀 [App.tsx] Root Component Mounting...');
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <AuthProvider>
                    <RootNavigator />
                </AuthProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}