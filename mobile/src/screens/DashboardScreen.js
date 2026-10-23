// ============================================================
// DashboardScreen.js — MiniLedger financial overview & stats
// Shows Total Lent, Repaid, Outstanding, and Overdue calculations.
// ============================================================

import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, ActivityIndicator,
    RefreshControl, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getSummary, getLoans, markAsRepaid } from '../api/api';

export default function DashboardScreen({ navigation }) {
    const { user, logout } = useAuth();

    const [summary, setSummary] = useState(null);
    const [recentLoans, setRecentLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        try {
            const [sumRes, loansRes] = await Promise.all([
                getSummary(),
                getLoans({ limit: 5, page: 1 }),
            ]);
            setSummary(sumRes.data.summary);
            setRecentLoans(loansRes.data.loans);
        } catch (err) {
            console.error('fetchData error:', err);
            Alert.alert('Connection Error', 'Could not load data. Ensure your backend server is running.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleRepay = (loan) => {
        Alert.alert(
            'Confirm Repayment',
            `Mark loan of ₹${parseFloat(loan.amount).toLocaleString('en-IN')} from ${loan.friend_name} as repaid?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Yes, Mark Repaid',
                    onPress: async () => {
                        try {
                            await markAsRepaid(loan.id);
                            fetchData(); // Refresh stats immediately
                        } catch (err) {
                            Alert.alert('Error', err.response?.data?.message || 'Could not mark loan as repaid.');
                        }
                    },
                },
            ]
        );
    };

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to log out of MiniLedger?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: logout },
        ]);
    };

    const formatCur = (val) =>
        '₹' + parseFloat(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#6366F1" />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />}
        >
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.appName}>MiniLedger 🤝</Text>
                    <Text style={styles.greeting}>+91 {user?.phone}</Text>
                </View>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} activeOpacity={0.8}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            {/* Main Stats Grid */}
            <View style={styles.statsContainer}>
                {/* 1. Total Lent */}
                <View style={[styles.statCard, styles.cardLent]}>
                    <View style={styles.statHeader}>
                        <Text style={styles.statTitle}>Total Lent</Text>
                        <Text style={styles.statBadge}>All Time</Text>
                    </View>
                    <Text style={styles.statNumber}>{formatCur(summary?.total_lent)}</Text>
                    <Text style={styles.statFooter}>{summary?.total_count || 0} total loans recorded</Text>
                </View>

                {/* 2. Outstanding */}
                <View style={[styles.statCard, styles.cardOutstanding]}>
                    <View style={styles.statHeader}>
                        <Text style={styles.statTitle}>Outstanding</Text>
                        <Text style={[styles.statBadge, { color: '#FBBF24', backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>Unpaid</Text>
                    </View>
                    <Text style={[styles.statNumber, { color: '#FBBF24' }]}>{formatCur(summary?.outstanding)}</Text>
                    <Text style={styles.statFooter}>{summary?.unpaid_count || 0} friends still owe</Text>
                </View>

                {/* Row for Repaid and Overdue */}
                <View style={styles.statsRow}>
                    {/* 3. Repaid */}
                    <View style={[styles.statCardHalf, styles.cardRepaid]}>
                        <Text style={styles.statTitleSmall}>Total Repaid</Text>
                        <Text style={[styles.statNumberSmall, { color: '#34D399' }]}>{formatCur(summary?.total_repaid)}</Text>
                        <Text style={styles.statFooterSmall}>✓ {summary?.repaid_count || 0} repaid</Text>
                    </View>

                    {/* 4. Overdue */}
                    <View style={[styles.statCardHalf, styles.cardOverdue]}>
                        <Text style={styles.statTitleSmall}>Overdue Amount</Text>
                        <Text style={[styles.statNumberSmall, { color: '#F87171' }]}>{formatCur(summary?.overdue)}</Text>
                        <Text style={styles.statFooterSmall}>⚠️ {summary?.overdue_count || 0} overdue</Text>
                    </View>
                </View>
            </View>

            {/* Quick Action Button */}
            <View style={styles.actionContainer}>
                <TouchableOpacity
                    style={styles.addLoanBtn}
                    onPress={() => navigation.navigate('AddLoan')}
                    activeOpacity={0.85}
                >
                    <Text style={styles.addLoanIcon}>+</Text>
                    <Text style={styles.addLoanText}>Add New Loan to a Friend</Text>
                </TouchableOpacity>
            </View>

            {/* Recent Loans Section */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Loans</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('LoanList')}>
                        <Text style={styles.seeAllText}>View All ({summary?.total_count || 0}) →</Text>
                    </TouchableOpacity>
                </View>

                {recentLoans.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>📝</Text>
                        <Text style={styles.emptyTitle}>No loans recorded yet</Text>
                        <Text style={styles.emptySub}>Tap the button above to record your first loan.</Text>
                    </View>
                ) : (
                    recentLoans.map((item) => (
                        <View key={item.id} style={[styles.loanCard, item.is_overdue && styles.loanCardOverdue]}>
                            <View style={styles.loanLeft}>
                                <View style={[styles.friendAvatar, item.is_repaid ? styles.avatarRepaid : (item.is_overdue ? styles.avatarOverdue : styles.avatarActive)]}>
                                    <Text style={styles.avatarText}>{item.friend_name.charAt(0).toUpperCase()}</Text>
                                </View>
                                <View style={styles.loanInfo}>
                                    <View style={styles.nameRow}>
                                        <Text style={styles.friendName}>{item.friend_name}</Text>
                                        {item.is_repaid ? (
                                            <View style={styles.badgeRepaid}>
                                                <Text style={styles.badgeTextRepaid}>Repaid ✓</Text>
                                            </View>
                                        ) : item.is_overdue ? (
                                            <View style={styles.badgeOverdue}>
                                                <Text style={styles.badgeTextOverdue}>OVERDUE ⚠️</Text>
                                            </View>
                                        ) : (
                                            <View style={styles.badgeActive}>
                                                <Text style={styles.badgeTextActive}>Active</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.dueDateText}>
                                        Due: {item.due_date} {item.notes ? `• ${item.notes}` : ''}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.loanRight}>
                                <Text style={[styles.loanAmount, item.is_repaid ? { color: '#94A3B8' } : (item.is_overdue ? { color: '#F87171' } : { color: '#F8FAFC' })]}>
                                    {formatCur(item.amount)}
                                </Text>

                                {!item.is_repaid && (
                                    <TouchableOpacity
                                        style={styles.repayButton}
                                        onPress={() => handleRepay(item)}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={styles.repayButtonText}>Mark Repaid</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    ))
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container:          { flex: 1, backgroundColor: '#0F172A' },
    centered:           { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' },
    header:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12 },
    appName:            { fontSize: 24, fontWeight: '800', color: '#F8FAFC' },
    greeting:           { fontSize: 13, color: '#818CF8', fontWeight: '600', marginTop: 2 },
    logoutBtn:          { backgroundColor: '#1E293B', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
    logoutText:         { color: '#94A3B8', fontSize: 12, fontWeight: '600' },

    statsContainer:     { paddingHorizontal: 20, paddingTop: 8 },
    statCard:           { borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1 },
    cardLent:           { backgroundColor: '#1E1B4B', borderColor: '#4338CA' },
    cardOutstanding:    { backgroundColor: '#1E293B', borderColor: '#334155' },
    statHeader:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statTitle:          { fontSize: 13, fontWeight: '600', color: '#C7D2FE' },
    statBadge:          { fontSize: 11, fontWeight: '700', color: '#A5B4FC', backgroundColor: 'rgba(99, 102, 241, 0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    statNumber:         { fontSize: 32, fontWeight: '800', color: '#fff', marginTop: 8, marginBottom: 4 },
    statFooter:         { fontSize: 12, color: '#94A3B8' },

    statsRow:           { flexDirection: 'row', gap: 12 },
    statCardHalf:       { flex: 1, borderRadius: 16, padding: 14, borderWidth: 1 },
    cardRepaid:         { backgroundColor: '#06281E', borderColor: '#065F46' },
    cardOverdue:        { backgroundColor: '#2E0E12', borderColor: '#991B1B' },
    statTitleSmall:     { fontSize: 12, fontWeight: '600', color: '#94A3B8' },
    statNumberSmall:    { fontSize: 20, fontWeight: '800', marginTop: 6, marginBottom: 2 },
    statFooterSmall:    { fontSize: 11, color: '#94A3B8' },

    actionContainer:    { paddingHorizontal: 20, marginTop: 12 },
    addLoanBtn:         { backgroundColor: '#6366F1', borderRadius: 14, paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, shadowColor: '#6366F1', shadowOpacity: 0.4, shadowRadius: 10, elevation: 6 },
    addLoanIcon:        { fontSize: 20, color: '#fff', fontWeight: '800' },
    addLoanText:        { fontSize: 15, fontWeight: '700', color: '#fff' },

    section:            { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },
    sectionHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    sectionTitle:       { fontSize: 17, fontWeight: '700', color: '#F8FAFC' },
    seeAllText:         { fontSize: 13, color: '#818CF8', fontWeight: '600' },

    emptyState:         { alignItems: 'center', paddingVertical: 40, backgroundColor: '#1E293B', borderRadius: 16, borderWidth: 1, borderColor: '#334155' },
    emptyIcon:          { fontSize: 36, marginBottom: 8 },
    emptyTitle:         { fontSize: 15, fontWeight: '700', color: '#F8FAFC' },
    emptySub:           { fontSize: 13, color: '#94A3B8', marginTop: 4 },

    loanCard:           { backgroundColor: '#1E293B', borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
    loanCardOverdue:    { borderColor: '#DC2626', backgroundColor: '#1E1418' },
    loanLeft:           { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    friendAvatar:       { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
    avatarActive:       { backgroundColor: '#312E81' },
    avatarRepaid:       { backgroundColor: '#064E3B' },
    avatarOverdue:      { backgroundColor: '#7F1D1D' },
    avatarText:         { fontSize: 16, fontWeight: '700', color: '#fff' },
    loanInfo:           { flex: 1 },
    nameRow:            { flexDirection: 'row', alignItems: 'center', gap: 8 },
    friendName:         { fontSize: 15, fontWeight: '700', color: '#F8FAFC' },
    badgeActive:        { backgroundColor: 'rgba(99, 102, 241, 0.15)', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
    badgeTextActive:    { color: '#818CF8', fontSize: 10, fontWeight: '700' },
    badgeRepaid:        { backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
    badgeTextRepaid:    { color: '#34D399', fontSize: 10, fontWeight: '700' },
    badgeOverdue:       { backgroundColor: 'rgba(239, 68, 68, 0.2)', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
    badgeTextOverdue:   { color: '#F87171', fontSize: 10, fontWeight: '800' },
    dueDateText:        { fontSize: 12, color: '#94A3B8', marginTop: 3 },

    loanRight:          { alignItems: 'flex-end', marginLeft: 8 },
    loanAmount:         { fontSize: 16, fontWeight: '800', marginBottom: 4 },
    repayButton:        { backgroundColor: '#059669', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
    repayButtonText:    { color: '#fff', fontSize: 11, fontWeight: '700' },
});
