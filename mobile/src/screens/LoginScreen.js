// ============================================================
// LoginScreen.js — Phone number entry to request OTP
// ============================================================

import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert,
    KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
    const { requestOtp } = useAuth();
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendOtp = async () => {
        const cleanPhone = phone.trim();
        if (!cleanPhone) {
            Alert.alert('Phone Required', 'Please enter your mobile phone number.');
            return;
        }

        if (cleanPhone.length < 8) {
            Alert.alert('Invalid Number', 'Please enter a valid phone number (at least 8 digits).');
            return;
        }

        setLoading(true);
        try {
            await requestOtp(cleanPhone);
            // Navigate to OTP verification screen
            navigation.navigate('Otp', { phone: cleanPhone });
        } catch (err) {
            const msg = err.response?.data?.message ||
                (err.response?.data?.errors ? err.response.data.errors.map(e => e.msg).join('\n') : null) ||
                'Could not send OTP. Make sure the backend server is running.';
            Alert.alert('Failed to send OTP', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                {/* Header Logo & Title */}
                <View style={styles.header}>
                    <View style={styles.logoBadge}>
                        <Text style={styles.logoIcon}>🤝</Text>
                    </View>
                    <Text style={styles.title}>MiniLedger</Text>
                    <Text style={styles.subtitle}>Track loans to friends & never lose count</Text>
                </View>

                {/* Login Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Login with Phone</Text>
                    <Text style={styles.cardDesc}>
                        Enter your mobile number to receive a 6-digit one-time password (OTP).
                    </Text>

                    <Text style={styles.label}>Phone Number</Text>
                    <View style={styles.phoneInputRow}>
                        <View style={styles.countryCode}>
                            <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                        </View>
                        <TextInput
                            style={styles.input}
                            placeholder="98765 43210"
                            placeholderTextColor="#64748B"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                            autoFocus
                        />
                    </View>

                    {/* Developer / Evaluator Notice */}
                    <View style={styles.infoBox}>
                        <Text style={styles.infoTitle}>💡 OTP Delivery Note:</Text>
                        <Text style={styles.infoText}>
                            The 6-digit OTP will be automatically generated and printed directly in your backend terminal console.
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.btn, loading && styles.btnDisabled]}
                        onPress={handleSendOtp}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.btnText}>Send OTP →</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container:      { flex: 1, backgroundColor: '#0F172A' },
    scroll:         { flexGrow: 1, justifyContent: 'center', padding: 24 },
    header:         { alignItems: 'center', marginBottom: 32 },
    logoBadge:      { width: 72, height: 72, borderRadius: 24, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
    logoIcon:       { fontSize: 36 },
    title:          { fontSize: 32, fontWeight: '800', color: '#F8FAFC', letterSpacing: 0.5 },
    subtitle:       { fontSize: 14, color: '#94A3B8', marginTop: 4, textAlign: 'center' },
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
    cardTitle:      { fontSize: 20, fontWeight: '700', color: '#F8FAFC' },
    cardDesc:       { fontSize: 13, color: '#94A3B8', marginTop: 4, marginBottom: 20, lineHeight: 18 },
    label:          { fontSize: 13, fontWeight: '600', color: '#94A3B8', marginBottom: 6 },
    phoneInputRow:  { flexDirection: 'row', gap: 8, marginBottom: 16 },
    countryCode:    {
        backgroundColor: '#0F172A',
        borderRadius: 12,
        paddingHorizontal: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#334155',
    },
    countryCodeText:{ color: '#F8FAFC', fontSize: 14, fontWeight: '600' },
    input:          {
        flex: 1,
        backgroundColor: '#0F172A',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        color: '#F8FAFC',
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    infoBox:        {
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.25)',
        marginBottom: 20,
    },
    infoTitle:      { color: '#818CF8', fontSize: 12, fontWeight: '700', marginBottom: 2 },
    infoText:       { color: '#C7D2FE', fontSize: 12, lineHeight: 16 },
    btn:            {
        backgroundColor: '#6366F1',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    btnDisabled:    { opacity: 0.6 },
    btnText:        { color: '#fff', fontSize: 16, fontWeight: '700' },
});
