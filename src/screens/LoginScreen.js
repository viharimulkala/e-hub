// src/screens/LoginScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firebase';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!email.trim()) return 'Please enter your email.';
    if (!emailRegex.test(email)) return 'Please enter a valid email address.';
    if (!password) return 'Please enter your password.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    return null;
  };

  const handleLogin = async () => {
    const err = validate();
    if (err) {
      Alert.alert('Validation error', err);
      return;
    }
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = cred.user;
      if (!user) throw new Error('No user returned from Firebase');

      const idToken = await user.getIdToken();
      const userObj = { uid: user.uid, email: user.email, displayName: user.displayName || null };

      await AsyncStorage.setItem('@ehub_token', idToken);
      await AsyncStorage.setItem('@ehub_user_v1', JSON.stringify(userObj));

      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs', params: { screen: 'Dashboard' } }],
      });
    } catch (error) {
      console.error('Login error', error);
      let msg = 'Login failed. Please try again.';
      if (error.code === 'auth/user-not-found') msg = 'No user found with this email.';
      if (error.code === 'auth/wrong-password') msg = 'Incorrect password.';
      if (error.code === 'auth/invalid-email') msg = 'Invalid email address.';
      Alert.alert('Sign in error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Welcome 👋</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="you@gmail.com"
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="password"
          secureTextEntry
          style={styles.input}
        />

        <TouchableOpacity
          style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryText}>Sign in</Text>
          )}
        </TouchableOpacity>

        <View style={styles.rowCenter}>
          <Text style={styles.muted}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={styles.link}> Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#F5F5FF', // soft lavender white
  },

  card: {
    padding: 10,
    borderRadius: 0, // no borders or rounded card
  },

  title: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 22,
    color: '#222',
  },

  label: {
    fontSize: 13,
    color: '#444',
    marginBottom: 4,
    marginTop: 12,
    fontWeight: '600',
  },

  input: {
    height: 48,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 14,
    // No borders at all
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
  },

  primaryBtn: {
    height: 48,
    backgroundColor: '#298ae6ff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },

  primaryText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },

  rowCenter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },

  muted: {
    color: '#555',
    fontSize: 14,
  },

  link: {
    color: '#ff4747ff',
    fontWeight: '800',
    fontSize: 14,
  },
});
