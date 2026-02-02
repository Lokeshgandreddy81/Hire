import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native'; // Added
import Constants from 'expo-constants';

// =============================================================================
// 🔒 CONSTANTS
// REPLACE WITH YOUR COMPUTER'S LOCAL LAN IP
// IS UNSTABLE? Check Metro logs 'exp://...' for truth.
// const API_BASE_URL = 'http://192.168.1.101:8000/api/v1'; // Legacy Hardcoded

// DYNAMIC IP RESOLUTION (Best for LAN/Tunnel)
const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
let localhost = debuggerHost?.split(':')[0] || '192.168.1.101'; // Fallback to verified IP

// 🔒 ANDROID EMULATOR FIX: Map localhost -> 10.0.2.2
if (Platform.OS === 'android' && localhost === 'localhost') {
    localhost = '10.0.2.2';
}

const API_BASE_URL = `http://${localhost}:8000/api/v1`;

console.log('🔗 API_BASE_URL configured as:', API_BASE_URL);

let inMemoryToken: string | null = null;

// =============================================================================
// TOKEN HANDLING (CRITICAL)
// =============================================================================

export const setInMemoryToken = (token: string | null) => {
    inMemoryToken = token;
};

// Callback to trigger logout from API layer
let onLogout: (() => void) | null = null;
export const registerLogoutCallback = (cb: () => void) => {
    onLogout = cb;
};

const getAuthHeaders = async () => {
    let token = inMemoryToken;

    if (!token) {
        token = await SecureStore.getItemAsync('userToken');
        if (token) inMemoryToken = token;
    }

    return token
        ? { Authorization: `Bearer ${token}` }
        : {};
};

// =============================================================================
// CORE REQUEST WRAPPER
// =============================================================================

const request = async (
    path: string,
    options: RequestInit = {}
) => {
    const headers = {
        'Content-Type': 'application/json',
        ...(await getAuthHeaders()),
        ...(options.headers || {}),
    };

    // 🔒 H6: Request Timeout (Prevent infinite buffering)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s Timeout

    let res;
    try {
        res = await fetch(`${API_BASE_URL}${path}`, {
            ...options,
            headers,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
    } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            console.error("Request Timeout:", path);
            throw new Error("Network timeout. Please check your connection.");
        }
        throw error;
    }

    // INTERCEPTOR: Handle 401 (Refresh Token Flow)
    if (res.status === 401) {
        // Prevent infinite loops if the refresh endpoint itself fails
        if (path.includes('/auth/refresh') || path.includes('/auth/logout')) {
            throw new Error('Session expired');
        }

        try {
            console.log('🔄 Access Token Expired. Attempting Refresh...');
            const refreshToken = await SecureStore.getItemAsync('refreshToken');

            if (!refreshToken) throw new Error('No refresh token');

            // Call Refresh Endpoint directly (via fetch to avoid circle)
            const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: refreshToken })
            });

            if (!refreshRes.ok) throw new Error('Refresh failed');

            const refreshData = await refreshRes.json();
            const { access_token, refresh_token: new_refresh_token } = refreshData;

            // Update Tokens
            setInMemoryToken(access_token);
            if (new_refresh_token) {
                await SecureStore.setItemAsync('refreshToken', new_refresh_token);
            }

            // Retry Original Request
            console.log('✅ Refresh Success. Retrying...');
            const newHeaders = {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${access_token}`,
                ...(options.headers || {}),
            };

            const retryRes = await fetch(`${API_BASE_URL}${path}`, {
                ...options,
                headers: newHeaders
            });

            if (!retryRes.ok) {
                const text = await retryRes.text();
                throw new Error(text || 'API Error after retry');
            }
            return retryRes.json();

        } catch (e) {
            console.warn('⚠️ Session Restoration Failed:', e);
            if (onLogout) onLogout();
            throw new Error('Session expired');
        }
    }

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'API Error');
    }

    return res.json();
};

// =============================================================================
// JOBS API
// =============================================================================

export const JobAPI = {
    /**
     * 🔒 STRICT MATCHED JOB FEED
     * Backend guarantees:
     * - id
     * - title
     * - companyName
     * - match_percentage (0–100)
     */
    getAllJobs: async () => {
        const data = await request('/jobs');

        if (!Array.isArray(data)) return [];

        return data.map((job: any) => ({
            id: job.id,
            title: job.title,
            company: job.companyName ?? job.company ?? 'Company',
            match_percentage: job.match_percentage ?? 0,
            location: job.location,
            minSalary: job.minSalary,
            maxSalary: job.maxSalary,
            remote: job.remote,
        }));
    },

    getJobById: async (jobId: string) => {
        return request(`/jobs/${jobId}`);
    },

    applyToJob: async (jobId: string) => {
        return request(`/jobs/${jobId}/apply`, {
            method: 'POST',
        });
    },

    createJob: async (jobData: any) => {
        return request('/jobs', {
            method: 'POST',
            body: JSON.stringify(jobData),
        });
    },

    getMyJobs: async () => {
        return request('/jobs/mine');
    },
};

// =============================================================================
// APPLICATIONS API
// =============================================================================

export const ApplicationAPI = {
    /**
     * Returns normalized applications:
     * - id
     * - status
     * - jobTitle
     * - companyName
     * - chat_id (nullable)
     */
    getAll: async () => {
        return request('/applications');
    },

    updateStatus: async (appId: string, status: 'accepted' | 'rejected') => {
        return request(`/applications/${appId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
    },
};

// =============================================================================
// CHATS API
// =============================================================================

export const ChatAPI = {
    getChats: async () => {
        return request('/chats');
    },

    getMessages: async (chatId: string) => {
        return request(`/chats/${chatId}`);
    },

    sendMessage: async (chatId: string, text: string, role?: string) => {
        return request(`/chats/${chatId}/messages`, {
            method: 'POST',
            body: JSON.stringify({ text, role }),
        });
    },
};

// =============================================================================
// PROFILES API
// =============================================================================

export const ProfileAPI = {
    createProfile: async (profile: any) => {
        return request('/profiles', {
            method: 'POST',
            body: JSON.stringify(profile),
        });
    },

    getMyProfiles: async () => {
        return request('/profiles');
    },
};

// =============================================================================
// AUTH API
// =============================================================================

export const AuthAPI = {
    sendOTP: async (identifier: string) => {
        return request('/auth/send-otp', {
            method: 'POST',
            body: JSON.stringify({ identifier }),
        });
    },

    verifyOTP: async (identifier: string, otp: string, role: string) => {
        return request('/auth/verify-otp', {
            method: 'POST',
            body: JSON.stringify({ identifier, otp, role }),
        });
    },

    refreshToken: async (token: string) => {
        // Manual fetch to avoid interceptor loop logic in 'request' wrapper if used directly
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s Timeout

        try {
            const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: token }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!res.ok) throw new Error('Refresh failed');
            return res.json();
        } catch (e) {
            clearTimeout(timeoutId);
            throw e;
        }
    },

    logout: async (refreshToken: string) => {
        return request('/auth/logout', {
            method: 'POST',
            body: JSON.stringify({ refresh_token: refreshToken })
        });
    }
};