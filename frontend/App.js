import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import LoginScreen from './src/screens/Login';
import OTPScreen from './src/screens/OTPVerify';
import RoleSelectScreen from './src/screens/RoleSelect';
import JobsScreen from './src/screens/Jobs';
import ApplicationsScreen from './src/screens/Applications';
import ConnectScreen from './src/screens/Connect';
import SettingsScreen from './src/screens/Settings';
import ProfilesScreen from './src/screens/Profiles';
import SmartInterviewScreen from './src/screens/SmartInterview';
import ProfileProcessingScreen from './src/screens/ProfileProcessing';
import ProfileReviewScreen from './src/screens/ProfileReview';
import JobDetailScreen from './src/screens/JobDetail';
import ChatScreen from './src/screens/Chat';
import { ActivityIndicator, View, Text } from 'react-native';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const DashboardTabs = () => {
    return (
        <Tab.Navigator screenOptions={{ headerShown: false }}>
            <Tab.Screen name="Applications" component={ApplicationsScreen} />
            <Tab.Screen name="Jobs" component={JobsScreen} />
            <Tab.Screen name="Profiles" component={ProfilesScreen} />
            <Tab.Screen name="Connect" component={ConnectScreen} />
            <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
    );
};

const AppStack = () => {
    const { userToken, isLoading } = React.useContext(AuthContext);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
                <ActivityIndicator size="large" color="#7B2CBF" />
                <Text style={{ marginTop: 10, color: '#666' }}>Loading...</Text>
            </View>
        )
    }

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {userToken == null ? (
                <>
                    <Stack.Screen name="RoleSelect" component={RoleSelectScreen} />
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="OTPVerify" component={OTPScreen} />
                </>
            ) : (
                <>
                    <Stack.Screen name="Dashboard" component={DashboardTabs} />
                    <Stack.Screen name="SmartInterview" component={SmartInterviewScreen} />
                    <Stack.Screen name="ProfileProcessing" component={ProfileProcessingScreen} />
                    <Stack.Screen name="ProfileReview" component={ProfileReviewScreen} />
                    <Stack.Screen name="JobDetail" component={JobDetailScreen} />
                    <Stack.Screen name="Chat" component={ChatScreen} />
                </>
            )}
        </Stack.Navigator>
    );
};

export default function App() {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <NavigationContainer>
                    <AppStack />
                </NavigationContainer>
            </AuthProvider>
        </ErrorBoundary>
    );
}
