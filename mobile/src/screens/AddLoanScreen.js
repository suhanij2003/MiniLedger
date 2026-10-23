// ============================================================
// AddLoanScreen.js — Record a new loan to a friend
// ============================================================

import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert,
    ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { createLoan } from '../api/api';

export default function AddLoanScreen({ navigation }) {
    // Helper to calculate date string YYYY-MM-DD
    const getDateOffset = (days) => {
        const d = new Date();
        d.setDate(d.getDate() + days);
        return d.toISOString().split('T')[0];
    };

    const [friendName, setFriendName] = useState('');
    const [amount, setAmount]         = useState('');
    const [dueDate, setDueDate]       = useState(getDateOffset(7)); // default 7 days from now
    const [notes, setNotes]           = useState('');
    const [loading, setLoading]       = useState(false);

    const handleSubmit = async () => {
        if (!friendName.trim()) {
            Alert.alert('Validation Error', 'Please enter your friend’s name.');
            return;
        }

        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            Alert.alert('Validation Error', 'Please enter a valid loan amount greater than ₹0.');
            return;
        }

        if (!dueDate.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate.trim())) {
            Alert.alert('Validation Error', 'Please provide a valid due date in YYYY-MM-DD format.');
            return;
        }

        setLoading(true);
        try {
            await createLoan({
                friend_name: friendName.trim(),
                amount: numAmount,
                due_date: dueDate.trim(),
                notes: notes.trim() || null,
            });

            Alert.alert(
                'Loan Recorded! 🎉',
                `Successfully added loan of ₹${numAmount.toLocaleString('en-IN')} to ${friendName.trim()}.`,
                [{ text: 'Done', onPress: () => navigation.goBack() }]
            );
        } catch (err) {
            const msg = err.response?.data?.message ||
                (err.response?.data?.errors ? err.response.data.errors.map(e => e.msg).join('\n') : null) ||
                'Could not save loan. Please check your network connection.';
            Alert.alert('Error', msg);
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
                <View style={styles.card}>
                    {/* Amount Input */}
                    <Text style={styles.labelCenter}>Loan Amount</Text>
                    <View style={styles.amountBox}>
                        <Text style={styles.currencySymbol}>₹</Text>
                        <TextInput
                            style={styles.amountInput}
                            placeholder="0"
                            placeholderTextColor="#475569"
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="numeric"
                            autoFocus
                        />
                    </View>

                    {/* Friend Name */}
                    <Text style={styles.label}>Friend's Name *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Rohan Gupta"
                        placeholderTextColor="#64748B"
                        value={friendName}
                        onChangeText={setFriendName}
                        autoCapitalize="words"
                    />

                    {/* Due Date */}
                    <Text style={styles.label}>Due Date (YYYY-MM-DD) *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#64748B"
                        value={dueDate}
                        onChangeText={setDueDate}
                    />

                    {/* Quick Date Presets */}
                    <View style={styles.presetsRow}>
                        {[
                            { label: '+3 Days', days: 3 },
                            { label: '+1 Week', days: 7 },
                            { label: '+2 Weeks', days: 14 },
                            { label: '+1 Month', days: 30 },
                        ].map((preset) => (
                            <TouchableOpacity
                                key={preset.days}
                                style={[
                                    styles.presetChip,
                                    dueDate === getDateOffset(preset.days) && styles.presetChipActive,
                                ]}
                                onPress={() => setDueDate(getDateOffset(preset.days))}
                                activeOpacity={0.8}
                            >
                                <Text
                                    style={[
                                        styles.presetText,
                                        dueDate === getDateOffset(preset.days) && styles.presetTextActive,
                                    ]}
                                >
                                    {preset.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Notes (Optional) */}
                    <Text style={styles.label}>Purpose / Note (Optional)</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="e.g. Split for dinner, emergency travel ticket"
                        placeholderTextColor="#64748B"
                        value={notes}
                        onChangeText={setNotes}
                        multiline
                        numberOfLines={3}
                    />

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[styles.submitBtn, loading && styles.btnDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitText}>Save Loan Entry ✓</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container:      { flex: 1, backgroundColor: '#0F172A' },
    scroll:         { padding: 20, paddingBottom: 40 },
    card:           { backgroundColor: '#1E293B', borderRadius: 20, padding: 22, borderWidth: 1, borderColor: '#334155' },
    labelCenter:    { fontSize: 13, fontWeight: '600', color: '#94A3B8', textAlign: 'center', marginBottom: 4 },
    amountBox:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
    currencySymbol: { fontSize: 36, fontWeight: '800', color: '#818CF8', marginRight: 4 },
    amountInput:    { fontSize: 44, fontWeight: '800', color: '#F8FAFC', minWidth: 140, textAlign: 'center' },

    label:          { fontSize: 13, fontWeight: '600', color: '#94A3B8', marginBottom: 6, marginTop: 12 },
    input:          {
        backgroundColor: '#0F172A',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        color: '#F8FAFC',
        fontSize: 15,
        borderWidth: 1,
        borderColor: '#334155',
    },
    textArea:       { minHeight: 70, textAlignVertical: 'top' },

    presetsRow:     { flexDirection: 'row', gap: 6, marginTop: 8, marginBottom: 8 },
    presetChip:     { flex: 1, backgroundColor: '#0F172A', borderRadius: 8, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
    presetChipActive:{ backgroundColor: '#312E81', borderColor: '#6366F1' },
    presetText:     { color: '#94A3B8', fontSize: 11, fontWeight: '600' },
    presetTextActive:{ color: '#C7D2FE', fontWeight: '700' },

    submitBtn:      { backgroundColor: '#6366F1', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 28 },
    btnDisabled:    { opacity: 0.6 },
    submitText:     { color: '#fff', fontSize: 16, fontWeight: '700' },
});
