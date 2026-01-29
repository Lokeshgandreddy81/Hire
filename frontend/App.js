import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import LoginScreen from './src/screens/Login';
import OTPScreen from './src/screens/OTPVerify';
import RoleSelectScreen from './src/screens/RoleSelect';
import JobsScreen from './src/screens/Jobs';
import { ActivityIndicator, View } from 'react-native';

const Stack = createNativeStackNavigator();

const AppStack = () => {
    const { userToken, isLoading } = React.useContext(AuthContext);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        )
    }

    return (
        <Stack.Navigator>
            {userToken == null ? (
                <>
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="OTPVerify" component={OTPScreen} />
                </>
            ) : (
                <>
                    <Stack.Screen name="RoleSelect" component={RoleSelectScreen} />
                    <Stack.Screen name="Jobs" component={JobsScreen} />
                </>
            )}
        </Stack.Navigator>
    );
};

export default function App() {
    return (
        <AuthProvider>
            <NavigationContainer>
                <AppStack />
            </NavigationContainer>
        </AuthProvider>
    );
}
