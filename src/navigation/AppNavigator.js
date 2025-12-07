// src/navigation/AppNavigator.js
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Onboarding from '../screens/Onboarding';
import LoginScreen from '../screens/LoginScreen';
import Signup from '../screens/Signup';             // <- ensure this file exists
import ForgotPassword from '../screens/ForgotPassword'; // <- ensure this file exists
import TabNavigator from './TabNavigator';
import ChatScreen from '../screens/ChatScreen';
import Dashboard from '../screens/Dashboard';
import Roadmap from '../screens/Roadmap';
import Profile from '../screens/Profile';

// storage keys
const ONBOARD_KEY = '@ehub_onboard_seen';
const USER_KEY = '@ehub_user_v1';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const [loading, setLoading] = useState(true);
  const [onboardSeen, setOnboardSeen] = useState(false);
  const [hasUser, setHasUser] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [seenRaw, userRaw] = await Promise.all([
          AsyncStorage.getItem(ONBOARD_KEY),
          AsyncStorage.getItem(USER_KEY),
        ]);
        setOnboardSeen(Boolean(seenRaw));
        setHasUser(Boolean(userRaw));
      } catch (err) {
        console.warn('AppNavigator: AsyncStorage read failed', err);
        setOnboardSeen(false);
        setHasUser(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#6B4EFF" />
      </View>
    );
  }

  const initialRoute = !onboardSeen ? 'Onboarding' : !hasUser ? 'Login' : 'MainTabs';

  return (
    <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
      {/* Register all routes unconditionally so navigation.navigate('Signup') will be handled */}
      <Stack.Screen name="Onboarding" component={Onboarding} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={Signup} />
      <Stack.Screen name="ForgotPassword" component={ForgotPassword} />

      {/* Main app */}
      <Stack.Screen name="MainTabs" component={TabNavigator} />

      {/* Extra screens (optional duplicates are okay; used for deep linking) */}
      <Stack.Screen name="ChatScreen" component={ChatScreen} />
      <Stack.Screen name="Dashboard" component={Dashboard} />
      <Stack.Screen name="Roadmap" component={Roadmap} />
      <Stack.Screen name="Profile" component={Profile} />
    </Stack.Navigator>
  );
}
