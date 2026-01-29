import React, { createContext, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import api, { setAuthToken } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [userToken, setUserToken] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const login = async (identifier) => {
        try {
            await api.post('/auth/send-otp', { identifier });
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    };

    const verifyOtp = async (identifier, otp, role) => {
        try {
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
        }
    };

    const logout = async () => {
        setUserToken(null);
        setUserInfo(null);
        await SecureStore.deleteItemAsync('userToken');
    };

    return (
        <AuthContext.Provider value={{ login, verifyOtp, logout, userToken, userInfo, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};
