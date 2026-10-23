// ============================================================
// AuthContext.js — Global authentication state for MiniLedger
// Manages phone OTP login, JWT token persistence, and active session.
// ============================================================

import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendOtp as sendOtpApi, verifyOtp as verifyOtpApi, getMe } from '../api/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // ── Restore session on startup ────────────────────────────
    useEffect(() => {
        const restoreSession = async () => {
            try {
                const storedToken = await AsyncStorage.getItem('token');
                if (storedToken) {
                    setToken(storedToken);
                    const res = await getMe();
                    setUser(res.data.user);
                }
            } catch (err) {
                // Token expired or invalid — clear it
                await AsyncStorage.removeItem('token');
                setToken(null);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        restoreSession();
    }, []);

    // ── Request OTP ───────────────────────────────────────────
    const requestOtp = async (phone) => {
        const res = await sendOtpApi(phone);
        return res.data;
    };

    // ── Verify OTP & Authenticate ─────────────────────────────
    const verifyAndLogin = async (phone, otp) => {
        const res = await verifyOtpApi(phone, otp);
        const { token: newToken, user: newUser } = res.data;
        await AsyncStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(newUser);
        return res.data;
    };

    // ── Logout ────────────────────────────────────────────────
    const logout = async () => {
        await AsyncStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, requestOtp, verifyAndLogin, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
