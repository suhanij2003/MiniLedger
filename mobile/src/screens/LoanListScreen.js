// ============================================================
// LoanListScreen.js — Complete loan registry with filtering,
// search, repayment actions, and overdue highlights.
// ============================================================

import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList,
    TextInput, TouchableOpacity, ActivityIndicator,
    Alert, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getLoans, markAsRepaid, deleteLoan } from '../api/api';

const STATUS_FILTERS = [
    { label: 'All', value: 'all' },
    { label: 'Unpaid', value: 'unpaid' },
    { label: 'Repaid', value: 'repaid' },
    { label: 'Overdue ⚠️', value: 'overdue' },
];

export default function LoanListScreen({ navigation }) {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [status, setStatus] = useState('all');
    const [search, setSearch] = useState('');

    const fetchLoansData = async (selectedStatus = status, searchQuery = search) => {
        try {
            const params = { limit: 100, page: 1 };
            if (selectedStatus && selectedStatus !== 'all') {
                params.status = selectedStatus;
            }
            if (searchQuery && searchQuery.trim()) {
                params.search = searchQuery.trim();
            }

            const res = await getLoans(params);
            setLoans(res.data.loans);
        } catch (err) {
            console.error('fetchLoans error:', err);
            Alert.alert('Error', 'Could not load loans list.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchLoansData(status, search);
        }, [status])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchLoansData(status, search);
    };

    const handleSearchChange = (text) => {
        setSearch(text);
        fetchLoansData(status, text);
    };

    const handleRepay = (loan) => {
        Alert.alert(
            'Mark as Repaid',
            `Confirm that ${loan.friend_name} has repaid ₹${parseFloat(loan.amount).toLocaleString('en-IN')}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm Repaid',
                    onPress: async () => {
                        try {
                            await markAsRepaid(loan.id);
                            fetchLoansData(status, search);
                        } catch (err) {
                            Alert.alert('Error', err.response?.data?.message || 'Failed to mark loan as repaid.');
                        }
                    },
                },
            ]
        );
    };

    const handleDelete = (loan) => {
        Alert.alert(
            'Delete Loan Entry',
            `Are you sure you want to delete the loan to ${loan.friend_name}? This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteLoan(loan.id);
                            setLoans((prev) => prev.filter((item) => item.id !== loan.id));
                        } catch (err) {
                            Alert.alert('Error', 'Could not delete loan.');
                        }
                    },
                },
            ]
        );
    };

    const formatCur = (val) =>
        '₹' + parseFloat(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

    const renderLoanItem = ({ item }) => (
        <View style={[styles.card, item.is_overdue && styles.cardOverdue]}>
            <View style={styles.cardHeader}>
                <View style={styles.friendDetails}>
                    <Text style={styles.friendName}>{item.friend_name}</Text>
                    <Text style={styles.dueDate}>
                        📅 Due: {item.due_date}
                    </Text>
                </View>

                <View style={styles.amountContainer}>
                    <Text style={[styles.amount, item.is_overdue ? styles.amountOverdue : (item.is_repaid ? styles.amountRepaid : styles.amountActive)]}>
                        {formatCur(item.amount)}
                    </Text>

                    {item.is_repaid ? (
                        <View style={styles.repaidTag}>
                            <Text style={styles.repaidTagText}>Repaid ✓</Text>
                        </View>
                    ) : item.is_overdue ? (
                        <View style={styles.overdueTag}>
                            <Text style={styles.overdueTagText}>OVERDUE ⚠️</Text>
                        </View>
                    ) : (
                        <View style={styles.activeTag}>
                            <Text style={styles.activeTagText}>Pending</Text>
                        </View>
                    )}
                </View>
            </View>

            {item.notes ? (
                <Text style={styles.notesText} numberOfLines={2}>
                    💬 "{item.notes}"
                </Text>
            ) : null}

            {/* Action Bar */}
            <View style={styles.cardFooter}>
                <Text style={styles.createdText}>
                    Added {new Date(item.created_at).toLocaleDateString()}
                    {item.repaid_at ? ` • Repaid ${new Date(item.repaid_at).toLocaleDateString()}` : ''}
                </Text>

                <View style={styles.actionsRow}>
                    {!item.is_repaid && (
                        <TouchableOpacity
                            style={styles.repayBtn}
                            onPress={() => handleRepay(item)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.repayBtnText}>Mark Repaid ✓</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => handleDelete(item)}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.deleteBtnIcon}>🗑</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Search Bar */}
            <View style={styles.searchBox}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by friend's name..."
                    placeholderTextColor="#64748B"
                    value={search}
                    onChangeText={handleSearchChange}
                />
                {search.length > 0 && (
                    <TouchableOpacity onPress={() => handleSearchChange('')}>
                        <Text style={styles.clearSearch}>✕</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Filter Tabs */}
            <View style={styles.filtersRow}>
                {STATUS_FILTERS.map((f) => (
                    <TouchableOpacity
                        key={f.value}
                        style={[styles.filterChip, status === f.value && styles.filterChipActive]}
                        onPress={() => setStatus(f.value)}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.filterText, status === f.value && styles.filterTextActive]}>
                            {f.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* List */}
            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#6366F1" />
                </View>
            ) : (
                <FlatList
                    data={loans}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={renderLoanItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>📋</Text>
                            <Text style={styles.emptyTitle}>No loans found</Text>
                            <Text style={styles.emptySub}>
                                {search ? 'Try clearing your search query' : 'No loans matching the selected filter'}
                            </Text>
                        </View>
                    }
                />
            )}

            {/* Floating Action Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('AddLoan')}
                activeOpacity={0.85}
            >
                <Text style={styles.fabIcon}>+</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container:          { flex: 1, backgroundColor: '#0F172A' },
    centered:           { flex: 1, justifyContent: 'center', alignItems: 'center' },

    searchBox:          { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', marginHorizontal: 16, marginTop: 14, marginBottom: 8, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: '#334155' },
    searchIcon:         { fontSize: 16, marginRight: 8 },
    searchInput:        { flex: 1, height: 44, color: '#F8FAFC', fontSize: 14 },
    clearSearch:        { color: '#94A3B8', fontSize: 16, padding: 4 },

    filtersRow:         { flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingBottom: 10 },
    filterChip:         { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155' },
    filterChipActive:   { backgroundColor: '#6366F1', borderColor: '#6366F1' },
    filterText:         { color: '#94A3B8', fontSize: 12, fontWeight: '600' },
    filterTextActive:   { color: '#fff', fontWeight: '700' },

    listContent:        { padding: 16, paddingBottom: 100 },

    card:               { backgroundColor: '#1E293B', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
    cardOverdue:        { borderColor: '#DC2626', backgroundColor: '#1F1316' },

    cardHeader:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    friendDetails:      { flex: 1 },
    friendName:         { fontSize: 17, fontWeight: '700', color: '#F8FAFC' },
    dueDate:            { fontSize: 12, color: '#94A3B8', marginTop: 4 },

    amountContainer:    { alignItems: 'flex-end', marginLeft: 8 },
    amount:             { fontSize: 18, fontWeight: '800', marginBottom: 4 },
    amountActive:       { color: '#F8FAFC' },
    amountRepaid:       { color: '#94A3B8', textDecorationLine: 'line-through' },
    amountOverdue:      { color: '#F87171' },

    activeTag:          { backgroundColor: 'rgba(99, 102, 241, 0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    activeTagText:      { color: '#818CF8', fontSize: 11, fontWeight: '700' },
    repaidTag:          { backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    repaidTagText:      { color: '#34D399', fontSize: 11, fontWeight: '700' },
    overdueTag:         { backgroundColor: 'rgba(239, 68, 68, 0.25)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    overdueTagText:     { color: '#F87171', fontSize: 11, fontWeight: '800' },

    notesText:          { fontSize: 13, color: '#CBD5E1', fontStyle: 'italic', marginTop: 10, backgroundColor: 'rgba(15, 23, 42, 0.4)', padding: 8, borderRadius: 8 },

    cardFooter:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(51, 65, 85, 0.5)' },
    createdText:        { fontSize: 11, color: '#64748B' },
    actionsRow:         { flexDirection: 'row', alignItems: 'center', gap: 8 },
    repayBtn:           { backgroundColor: '#059669', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    repayBtnText:       { color: '#fff', fontSize: 12, fontWeight: '700' },
    deleteBtn:          { padding: 6, backgroundColor: '#0F172A', borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
    deleteBtnIcon:      { fontSize: 14 },

    emptyContainer:     { alignItems: 'center', paddingVertical: 60 },
    emptyIcon:          { fontSize: 44, marginBottom: 12 },
    emptyTitle:         { fontSize: 16, fontWeight: '700', color: '#F8FAFC' },
    emptySub:           { fontSize: 13, color: '#94A3B8', marginTop: 4 },

    fab:                { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#6366F1', justifyContent: 'center', alignItems: 'center', shadowColor: '#6366F1', shadowOpacity: 0.6, shadowRadius: 12, elevation: 8 },
    fabIcon:            { fontSize: 28, color: '#fff', fontWeight: '300', lineHeight: 32 },
});
