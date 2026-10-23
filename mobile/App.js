// ============================================================
// App.js — Root of the MiniLedger mobile application
// Sets up Navigation and wraps the application in AuthProvider.
// ============================================================

import React from 'react';
import { ActivityIndicator, View, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthProvider, useAuth } from './src/context/AuthContext';

// Screens
import LoginScreen    from './src/screens/LoginScreen';
import OtpScreen      from './src/screens/OtpScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import AddLoanScreen  from './src/screens/AddLoanScreen';
import LoanListScreen from './src/screens/LoanListScreen';

const Stack = createNativeStackNavigator();

// ── Auth Navigator (shown when NOT logged in) ─────────────────
function AuthStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Otp"   component={OtpScreen} />
        </Stack.Navigator>
    );
}

// ── App Navigator (shown when logged in) ──────────────────────
function AppStack() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle:        { backgroundColor: '#1E293B' },
                headerTintColor:    '#F8FAFC',
                headerTitleStyle:   { fontWeight: '700', fontSize: 17 },
                headerBackTitle:    'Back',
                contentStyle:       { backgroundColor: '#0F172A' },
            }}
        >
            <Stack.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="AddLoan"
                component={AddLoanScreen}
                options={{ title: 'Record Friend Loan' }}
            />
            <Stack.Screen
                name="LoanList"
                component={LoanListScreen}
                options={{ title: 'Friend Loans Registry' }}
            />
        </Stack.Navigator>
    );
}

// ── Root Navigator — switches between auth/app based on JWT ───
function RootNavigator() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' }}>
                <ActivityIndicator size="large" color="#6366F1" />
            </View>
        );
    }

    return user ? <AppStack /> : <AuthStack />;
}

// ── App Entry Point ───────────────────────────────────────────
export default function App() {
    return (
        <AuthProvider>
            <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
            <NavigationContainer>
                <RootNavigator />
            </NavigationContainer>
        </AuthProvider>
    );
}
