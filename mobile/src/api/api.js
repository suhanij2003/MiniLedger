// ============================================================
// api.js — Axios instance pre-configured for the MiniLedger API
// Automatically attaches JWT token to requests from AsyncStorage.
// ============================================================

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Android emulator uses 10.0.2.2 to reach host machine localhost.
// iOS simulator & Web can use localhost:3000.
// Physical devices can change this to their computer's LAN IP (e.g. 192.168.1.X:3000).
const DEV_MACHINE_IP = '10.0.2.2'; // Change if testing on physical phone

export const BASE_URL = Platform.select({
    android: `http://${DEV_MACHINE_IP}:3000`,
    ios: 'http://localhost:3000',
    default: 'http://localhost:3000',
});

const api = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000,
});

// ── Request Interceptor ───────────────────────────────────────
api.interceptors.request.use(
    async (config) => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (e) {
            console.error('Error reading token from storage:', e);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ── Auth API ─────────────────────────────────────────────────
export const sendOtp   = (phone)      => api.post('/api/auth/send-otp', { phone });
export const verifyOtp = (phone, otp) => api.post('/api/auth/verify-otp', { phone, otp });
export const getMe     = ()           => api.get('/api/auth/me');

// ── Loans API ────────────────────────────────────────────────
export const getLoans     = (params) => api.get('/api/loans', { params });
export const getLoanById  = (id)     => api.get(`/api/loans/${id}`);
export const createLoan   = (data)   => api.post('/api/loans', data);
export const markAsRepaid = (id)     => api.patch(`/api/loans/${id}/repay`);
export const deleteLoan   = (id)     => api.delete(`/api/loans/${id}`);
export const getSummary   = ()       => api.get('/api/loans/summary');

export default api;
