import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api, { setAuthToken, setOnUnauthorized } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [userToken, setUserToken] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadToken();
    }, []);

    useEffect(() => {
        setOnUnauthorized(async () => {
            setUserToken(null);
            setUserInfo(null);
            setAuthToken(null);
            try {
                await SecureStore.deleteItemAsync('userToken');
            } catch (_) {}
        });
        return () => setOnUnauthorized(() => {});
    }, []);

    const loadToken = async () => {
        try {
            const token = await Promise.race([
                SecureStore.getItemAsync('userToken'),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('timeout')), 3000)
                )
            ]);
            
            if (token) {
                setUserToken(token);
                setAuthToken(token);
            }
        } catch (e) {
            if (e.message !== 'timeout') {
                console.error('Failed to load token:', e);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (identifier) => {
        try {
            setIsLoading(true);
            await api.post('/auth/send-otp', { identifier });
            return true;
        } catch (e) {
            console.error(e);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const verifyOtp = async (identifier, otp, role) => {
        try {
            setIsLoading(true);
            const response = await api.post('/auth/verify-otp', { identifier, otp, role });
            const { access_token, user_id } = response.data;
            setUserToken(access_token);
            setUserInfo({ identifier, role, user_id });
            setAuthToken(access_token);
            await SecureStore.setItemAsync('userToken', access_token);
            return true;
        } catch (e) {
            console.error(e);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setUserToken(null);
        setUserInfo(null);
        setAuthToken(null);
        await SecureStore.deleteItemAsync('userToken');
    };

    return (
        <AuthContext.Provider value={{ login, verifyOtp, logout, userToken, userInfo, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};
