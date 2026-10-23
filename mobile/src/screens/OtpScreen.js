// ============================================================
// OtpScreen.js — 6-digit OTP verification screen
// ============================================================

import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert,
    KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function OtpScreen({ route, navigation }) {
    const { phone } = route.params || {};
    const { verifyAndLogin, requestOtp } = useAuth();

    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);

    const handleVerify = async () => {
        const cleanOtp = otp.trim();
        if (!cleanOtp || cleanOtp.length < 4) {
            Alert.alert('Invalid OTP', 'Please enter the 6-digit OTP code shown in your backend console.');
            return;
        }

        setLoading(true);
        try {
            await verifyAndLogin(phone, cleanOtp);
            // On success, RootNavigator in App.js switches to AppStack automatically!
        } catch (err) {
            const msg = err.response?.data?.message || 'Verification failed. Please check the OTP in your terminal.';
            Alert.alert('Verification Failed', msg);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResending(true);
        try {
            await requestOtp(phone);
            Alert.alert('OTP Sent', 'A fresh OTP has been generated and printed in your backend terminal.');
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to resend OTP. Please wait before retrying.';
            Alert.alert('Error', msg);
        } finally {
            setResending(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.logoBadge}>
                        <Text style={styles.logoIcon}>🔐</Text>
                    </View>
                    <Text style={styles.title}>Enter OTP</Text>
                    <Text style={styles.subtitle}>
                        We sent a 6-digit verification code for{'\n'}
                        <Text style={styles.phoneHighlight}>+91 {phone}</Text>
                    </Text>
                </View>

                {/* Card */}
                <View style={styles.card}>
                    <Text style={styles.label}>Verification Code</Text>
                    <TextInput
                        style={styles.otpInput}
                        placeholder="••••••"
                        placeholderTextColor="#475569"
                        value={otp}
                        onChangeText={setOtp}
                        keyboardType="number-pad"
                        maxLength={6}
                        autoFocus
                    />

                    <View style={styles.hintBox}>
                        <Text style={styles.hintIcon}>⚡</Text>
                        <Text style={styles.hintText}>
                            Check your <Text style={{ fontWeight: '700' }}>backend terminal / console</Text> for the printed 6-digit code.
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.btn, loading && styles.btnDisabled]}
                        onPress={handleVerify}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.btnText}>Verify & Continue ✓</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.actionLinks}>
                        <TouchableOpacity
                            onPress={handleResend}
                            disabled={resending}
                            style={styles.resendBtn}
                        >
                            {resending ? (
                                <ActivityIndicator size="small" color="#6366F1" />
                            ) : (
                                <Text style={styles.linkText}>Resend OTP</Text>
                            )}
                        </TouchableOpacity>

                        <Text style={styles.dividerDot}>•</Text>

                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.resendBtn}>
                            <Text style={styles.linkSecondary}>Change Phone</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container:      { flex: 1, backgroundColor: '#0F172A' },
    scroll:         { flexGrow: 1, justifyContent: 'center', padding: 24 },
    header:         { alignItems: 'center', marginBottom: 28 },
    logoBadge:      { width: 72, height: 72, borderRadius: 24, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
    logoIcon:       { fontSize: 36 },
    title:          { fontSize: 28, fontWeight: '800', color: '#F8FAFC' },
    subtitle:       { fontSize: 14, color: '#94A3B8', marginTop: 6, textAlign: 'center', lineHeight: 20 },
    phoneHighlight: { color: '#818CF8', fontWeight: '700' },
    card:           {
        backgroundColor: '#1E293B',
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: '#334155',
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    label:          { fontSize: 13, fontWeight: '600', color: '#94A3B8', marginBottom: 8, textAlign: 'center' },
    otpInput:       {
        backgroundColor: '#0F172A',
        borderRadius: 14,
        paddingVertical: 16,
        color: '#F8FAFC',
        fontSize: 32,
        fontWeight: '800',
        textAlign: 'center',
        letterSpacing: 10,
        borderWidth: 1.5,
        borderColor: '#6366F1',
        marginBottom: 16,
    },
    hintBox:        {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.25)',
        marginBottom: 20,
        gap: 8,
    },
    hintIcon:       { fontSize: 18 },
    hintText:       { flex: 1, color: '#FCD34D', fontSize: 12, lineHeight: 16 },
    btn:            {
        backgroundColor: '#6366F1',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    btnDisabled:    { opacity: 0.6 },
    btnText:        { color: '#fff', fontSize: 16, fontWeight: '700' },
    actionLinks:    { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20, gap: 12 },
    resendBtn:      { paddingVertical: 4 },
    linkText:       { color: '#818CF8', fontSize: 14, fontWeight: '600' },
    linkSecondary:  { color: '#94A3B8', fontSize: 14 },
    dividerDot:     { color: '#475569' },
});
