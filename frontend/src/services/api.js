import axios from 'axios';
import { Platform } from 'react-native';

// For Android physical device: Use your computer's local IP (192.168.1.114)
// For Android emulator: Use 10.0.2.2
// For iOS: Use localhost for simulator, or local IP for physical device
const BASE_URL = Platform.OS === 'android'
    ? 'http://192.168.1.114:8000/api/v1'
    : 'http://localhost:8000/api/v1';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

// Launch requirement: 401/403 → forced re-login (token expiry handled)
let onUnauthorized = () => {};
export function setOnUnauthorized(fn) {
    onUnauthorized = fn;
}

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        if (status === 401 || status === 403) {
            onUnauthorized();
        }
        if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
            console.error('Backend server is not running.');
        }
        return Promise.reject(error);
    }
);

export const setAuthToken = (token) => {
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete api.defaults.headers.common['Authorization'];
    }
};

export default api;
