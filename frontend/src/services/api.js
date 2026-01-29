import axios from 'axios';
import { Platform } from 'react-native';

// For Android physical device: Use your computer's local IP (192.168.1.114)
// For Android emulator: Use 10.0.2.2
// For iOS: Use localhost for simulator, or local IP for physical device
const BASE_URL = Platform.OS === 'android' 
    ? 'http://192.168.1.114:8000/api/v1'  // Change to 10.0.2.2 if using Android emulator
    : 'http://localhost:8000/api/v1';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 second timeout
});

// Add request interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error.message);
        if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
            console.error('Backend server is not running. Please start it with: cd backend && python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000');
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
