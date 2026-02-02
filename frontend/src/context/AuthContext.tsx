import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { AuthAPI, setInMemoryToken, registerLogoutCallback } from '../services/api';
import { UserRole } from '../types';

// =============================================================================
// TYPES
// =============================================================================

interface User {
    id: string;
    identifier: string; // Email or Phone
    role: UserRole;
    isNewUser?: boolean;
}

interface AuthContextData {
    userToken: string | null;
    userInfo: User | null;
    isLoading: boolean;
    login: (identifier: string) => Promise<boolean>;
    verifyOtp: (identifier: string, otp: string, role: UserRole) => Promise<boolean>;
    logout: () => Promise<void>;
    updateUser: (updates: Partial<User>) => void;
}

// =============================================================================
// CONTEXT
// =============================================================================

export const AuthContext = createContext < AuthContextData > ({} as AuthContextData);

// Hook for easy usage
export const useAuth = () => useContext(AuthContext);

// =============================================================================
// PROVIDER
// =============================================================================

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [userToken, setUserToken] = useState < string | null > (null);
    const [userInfo, setUserInfo] = useState < User | null > (null);
    const [isLoading, setIsLoading] = useState(true);

    // 1. BOOTSTRAP: Load persisted data on app launch
    useEffect(() => {
        const bootstrapAsync = async () => {
            try {
                // Register Interceptor Callback
                registerLogoutCallback(apiLogout);

                // Parallel read for speed
                const [refreshToken, userJson] = await Promise.all([
                    SecureStore.getItemAsync('refreshToken'),
                    SecureStore.getItemAsync('userData')
                ]);

                if (refreshToken && userJson) {
                    // 🔒 H4: Try to get fresh access token immediately
                    // This proves the refresh token is valid before letting user in.
                    try {
                        const { access_token, refresh_token: new_rt } = await AuthAPI.refreshToken(refreshToken);

                        setInMemoryToken(access_token);
                        setUserToken(access_token); // Signals "Logged In" to App.tsx
                        setUserInfo(JSON.parse(userJson));

                        // Update rotated refresh token
                        if (new_rt) {
                            await SecureStore.setItemAsync('refreshToken', new_rt);
                        }
                    } catch (refreshErr) {
                        console.warn('Bootstrap Refresh Failed:', refreshErr);
                        await apiLogout(); // Token invalid/expired -> Force Login
                    }
                }
            } catch (e) {
                console.warn('Auth Restore Failed:', e);
                await apiLogout();
            } finally {
                setIsLoading(false);
            }
        };

        bootstrapAsync();
    }, []);

    // 2. LOGIN STEP 1: Send OTP
    const login = async (identifier: string): Promise<boolean> => {
        try {
            await AuthAPI.sendOTP(identifier);
            return true;
        } catch (e) {
            console.error("Login Error:", e);
            return false;
        }
    };

    // 3. LOGIN STEP 2: Verify & Persist
    const verifyOtp = async (identifier: string, otp: string, role: UserRole): Promise<boolean> => {
        try {
            setIsLoading(true);
            const response = await AuthAPI.verifyOTP(identifier, otp, role);

            // Response structure matches backend: { access_token, refresh_token, role, user_id, is_new_user }
            const { access_token, refresh_token, user_id, is_new_user } = response;

            const userObj: User = {
                id: user_id,
                identifier,
                role: role, // Ensure we store the role used during login
                isNewUser: is_new_user
            };

            // a. Update State
            setInMemoryToken(access_token);
            setUserToken(access_token);
            setUserInfo(userObj);

            // b. Persist to Storage (Critical for App Restart)
            // Note: access_token is memory-only now. We store refresh_token.
            const storagePromises = [
                SecureStore.setItemAsync('userData', JSON.stringify(userObj))
            ];

            if (refresh_token) {
                storagePromises.push(SecureStore.setItemAsync('refreshToken', refresh_token));
            }

            await Promise.all(storagePromises);

            return true;
        } catch (e) {
            console.error("Verify OTP Error:", e);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    // 4. LOGOUT: Clear everything
    // apiLogout is the internal function used by interceptor
    const apiLogout = async () => {
        try {
            const rt = await SecureStore.getItemAsync('refreshToken');
            if (rt) {
                // Best effort backend notification
                try { await AuthAPI.logout(rt); } catch (e) { }
            }

            await Promise.all([
                SecureStore.deleteItemAsync('refreshToken'),
                SecureStore.deleteItemAsync('userData'),
                SecureStore.deleteItemAsync('userToken') // Cleanup old legacy key if exists
            ]);

            setInMemoryToken(null);
            setUserToken(null);
            setUserInfo(null);
        } catch (e) {
            console.error("Logout Error:", e);
        }
    };

    // Public logout (exposed to context consumers)
    const logout = async () => {
        setIsLoading(true);
        await apiLogout();
        setIsLoading(false);
    };

    // Helper: Update local user state without full re-login (e.g., after onboarding)
    const updateUser = (updates: Partial<User>) => {
        setUserInfo(prev => {
            if (!prev) return null;
            const newUser = { ...prev, ...updates };
            // Persist the update
            SecureStore.setItemAsync('userData', JSON.stringify(newUser));
            return newUser;
        });
    };

    return (
        <AuthContext.Provider value={{
            login,
            verifyOtp,
            logout,
            updateUser,
            userToken,
            userInfo,
            isLoading
        }}>
            {children}
        </AuthContext.Provider>
    );
};