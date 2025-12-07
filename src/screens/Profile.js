// src/screens/Profile.js
// Polished Profile screen for E-Hub
// - Shows Firebase user info, edit displayName, logout, delete account (requires reauth).
// - Assumes `src/firebase/firebase.js` exports `auth` (modular v9).
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Animated,
  Easing,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  onAuthStateChanged,
  signOut,
  updateProfile,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { auth } from '../firebase/firebase';

// storage keys used in app
const USER_KEY = '@ehub_user_v1';
const TOKEN_KEY = '@ehub_token';

// small emoji palette for fallback avatars
const EMOJIS = ['😄','😎','🤓','🚀','✨','🔥','🌟','🎯','🧠','📚'];

const pickEmoji = (seed) => {
  if (!seed) return EMOJIS[0];
  let sum = 0;
  for (let i = 0; i < seed.length; i++) sum += seed.charCodeAt(i);
  return EMOJIS[sum % EMOJIS.length];
};

export default function Profile({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null); // { uid, email, displayName, photoURL }
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  // avatar bounce
  const bounce = useRef(new Animated.Value(1)).current;
  const animateBounce = () => {
    bounce.setValue(0.95);
    Animated.timing(bounce, {
      toValue: 1,
      duration: 350,
      easing: Easing.bounce,
      useNativeDriver: true,
    }).start();
  };

  // Load current user and subscribe to auth changes
  useEffect(() => {
    let unsub = null;
    const init = async () => {
      try {
        unsub = onAuthStateChanged(auth, async (fbUser) => {
          if (fbUser) {
            const u = {
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: fbUser.displayName || deriveNameFromEmail(fbUser.email),
              photoURL: fbUser.photoURL || null,
            };
            setUser(u);
            try {
              await AsyncStorage.setItem(USER_KEY, JSON.stringify(u));
            } catch (err) {
              console.warn('Profile: failed to persist user', err);
            }
          } else {
            // fallback to AsyncStorage (cold start)
            try {
              const raw = await AsyncStorage.getItem(USER_KEY);
              setUser(raw ? JSON.parse(raw) : null);
            } catch (err) {
              setUser(null);
            }
          }
          setLoading(false);
        });
      } catch (err) {
        // fallback read
        try {
          const raw = await AsyncStorage.getItem(USER_KEY);
          setUser(raw ? JSON.parse(raw) : null);
        } catch (e) {
          setUser(null);
        } finally {
          setLoading(false);
        }
      }
    };
    init();

    return () => {
      if (unsub) unsub();
    };
  }, []);

  const deriveNameFromEmail = (email = '') => {
    if (!email) return 'User';
    const local = email.split('@')[0];
    const parts = local.split(/[._-]/).filter(Boolean);
    return parts.map(p => p[0]?.toUpperCase() + p.slice(1)).join(' ') || local;
  };

  const startEdit = () => {
    setNameDraft(user?.displayName || '');
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setNameDraft('');
  };

  const saveName = async () => {
    const trimmed = (nameDraft || '').trim();
    if (!trimmed) {
      Alert.alert('Invalid name', 'Name cannot be empty.');
      return;
    }
    setBusy(true);
    try {
      if (!auth.currentUser) throw new Error('No authenticated user');
      // optimistic UI
      const prev = { ...user };
      setUser(u => ({ ...u, displayName: trimmed }));
      animateBounce();

      // update firebase profile
      await updateProfile(auth.currentUser, { displayName: trimmed });
      // update local storage
      const updated = { ...(user || {}), displayName: trimmed };
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(updated));
      setEditing(false);
      Alert.alert('Saved', 'Your display name was updated.');
    } catch (err) {
      console.error('saveName error', err);
      Alert.alert('Error', 'Failed to update name — try again.');
      // revert UI by reloading from auth (best-effort)
      if (auth.currentUser) {
        const fb = auth.currentUser;
        setUser({
          uid: fb.uid,
          email: fb.email,
          displayName: fb.displayName || deriveNameFromEmail(fb.email),
          photoURL: fb.photoURL || null,
        });
      }
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Log out', 'Do you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: async () => {
        setBusy(true);
        try {
          if (auth.currentUser) await signOut(auth);
          await AsyncStorage.removeItem(USER_KEY);
          await AsyncStorage.removeItem(TOKEN_KEY);
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        } catch (err) {
          console.error('Logout failed', err);
          Alert.alert('Error', 'Logout failed. Check console.');
          setBusy(false);
        }
      } }
    ]);
  };

  // Delete account (dangerous) — requires recent auth in many cases
  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete account',
      'This will permanently delete your account. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: confirmDeleteAccount },
      ]
    );
  };

  // Confirm & perform deletion
  const confirmDeleteAccount = async () => {
    if (!auth.currentUser) {
      Alert.alert('Not signed in', 'No user to delete.');
      return;
    }
    // For safety: Ask for password re-entry via prompt (simple approach)
    // Note: In production, build a secure reauth flow (modal) and validate.
    Alert.prompt?.(
      'Confirm password',
      'Please enter your password to permanently delete your account.',
      async (password) => {
        if (!password) { Alert.alert('Cancelled'); return; }
        setBusy(true);
        try {
          const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
          await reauthenticateWithCredential(auth.currentUser, credential);
          // Now safe to delete
          await deleteUser(auth.currentUser);
          await AsyncStorage.removeItem(USER_KEY);
          await AsyncStorage.removeItem(TOKEN_KEY);
          Alert.alert('Deleted', 'Your account has been deleted.');
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        } catch (err) {
          console.error('delete user failed', err);
          Alert.alert('Delete failed', err?.message || 'Reauthentication required or failed.');
          setBusy(false);
        }
      },
      'secure-text'
    ) ?? Alert.alert('Re-auth required', 'Reauthentication is required to delete account. Please sign in again and try.');
  };

  const refresh = async () => {
    setBusy(true);
    try {
      const fb = auth.currentUser;
      if (fb) {
        setUser({
          uid: fb.uid,
          email: fb.email,
          displayName: fb.displayName || deriveNameFromEmail(fb.email),
          photoURL: fb.photoURL || null,
        });
      } else {
        const raw = await AsyncStorage.getItem(USER_KEY);
        setUser(raw ? JSON.parse(raw) : null);
      }
      Alert.alert('Refreshed');
    } catch (err) {
      console.warn('refresh failed', err);
      Alert.alert('Refresh failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6B4EFF" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.noUserTitle}>No user data</Text>
        <Text style={styles.noUserSub}>Please sign in to view your profile.</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] })}>
          <Text style={styles.primaryText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const emoji = pickEmoji(user.uid || user.email || user.displayName || 'ehub');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.gradientHeader}>
        <Animated.View style={[styles.avatarWrap, { transform: [{ scale: bounce }] }]}>
          {user.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarEmojiBox}>
              <Text style={styles.avatarEmoji}>{emoji}</Text>
            </View>
          )}
        </Animated.View>

        <View style={styles.headerMeta}>
          {!editing ? (
            <>
              <Text style={styles.displayName}>{user.displayName}</Text>
              <Text style={styles.emailText}>📧 {user.email}</Text>
            </>
          ) : (
            <>
              <TextInput
                style={styles.nameInput}
                value={nameDraft}
                onChangeText={setNameDraft}
                placeholder="Enter display name"
                autoCapitalize="words"
              />
              <View style={styles.editRow}>
                <TouchableOpacity onPress={cancelEdit} style={styles.ghostBtn}><Text style={styles.ghostText}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity onPress={saveName} style={styles.saveBtn} disabled={busy}><Text style={styles.saveText}>{busy ? 'Saving...' : 'Save'}</Text></TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account</Text>
        <View style={styles.infoRow}><Text style={styles.k}>UID</Text><Text style={styles.v}>{user.uid}</Text></View>
        <View style={styles.infoRow}><Text style={styles.k}>Email</Text><Text style={styles.v}>{user.email}</Text></View>

        <View style={{ marginTop: 12 }}>
          {!editing && <TouchableOpacity style={styles.actionBtn} onPress={startEdit}><Text style={styles.actionText}>✏️ Edit display name</Text></TouchableOpacity>}
          <TouchableOpacity style={[styles.actionBtn, styles.logoutBtn]} onPress={handleLogout}><Text style={[styles.actionText, styles.logoutText]}>🚪 Log out</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={handleDeleteAccount}><Text style={[styles.actionText, styles.deleteText]}>🗑️ Delete account</Text></TouchableOpacity>
        </View>

        <View style={{ marginTop: 10, alignItems: 'center' }}>
          <TouchableOpacity onPress={refresh}><Text style={styles.refreshText}>🔁 Refresh</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setShowDebug(s => !s)}><Text style={styles.debugToggle}>{showDebug ? 'Hide debug' : 'Show debug'}</Text></TouchableOpacity>
        </View>

        {showDebug && (
          <View style={styles.debugBox}>
            <Text style={styles.debugTitle}>Debug</Text>
            <Text style={styles.debugKey}>auth.currentUser:</Text>
            <Text style={styles.debugVal}>{JSON.stringify(auth.currentUser ? { uid: auth.currentUser.uid, email: auth.currentUser.email, displayName: auth.currentUser.displayName } : null, null, 2)}</Text>
            <Text style={styles.debugKey}>AsyncStorage {USER_KEY}:</Text>
            <Text style={styles.debugVal}>{'Check AsyncStorage in console or device inspector'}</Text>
          </View>
        )}
      </View>

      <View style={{ height: 30 }} />

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 40, backgroundColor: '#f6f7fb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  noUserTitle: { fontSize: 20, fontWeight: '800' },
  noUserSub: { color: '#666', marginBottom: 12 },

  gradientHeader: {
    backgroundColor: '#5117f19a',
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: { width: 92, height: 92, borderRadius: 46, marginRight: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  avatarImage: { width: 92, height: 92, borderRadius: 46 },
  avatarEmojiBox: { width: 86, height: 86, borderRadius: 43, alignItems: 'center', justifyContent: 'center' },
  avatarEmoji: { fontSize: 40 },
  headerMeta: { flex: 1 },
  displayName: { color: '#fff', fontSize: 20, fontWeight: '800' },
  emailText: { color: '#e8e8ff', marginTop: 6 },

  nameInput: { height: 44, backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, marginTop: 6 },
  editRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
  ghostBtn: { paddingVertical: 8, paddingHorizontal: 12, marginRight: 8 },
  ghostText: { color: '#fff', fontWeight: '700' },
  saveBtn: { backgroundColor: '#fff', paddingHorizontal: 14, borderRadius: 8, justifyContent: 'center' },
  saveText: { color: '#bcb5e2ff', fontWeight: '800' },

  card: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 12, padding: 14, marginTop: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 8 }, shadowRadius: 16, elevation: 3 },
  cardTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomColor: '#f4f4f6', borderBottomWidth: 1 },
  k: { color: '#666', fontWeight: '700' },
  v: { color: '#333', maxWidth: '68%' },

  actionBtn: { height: 48, borderRadius: 10, borderWidth: 1, borderColor: '#e6e9ef', alignItems: 'center', justifyContent: 'center', marginTop: 10, backgroundColor: '#fff' },
  actionText: { fontWeight: '800', color: '#1f6feb' },
  logoutBtn: { borderColor: '#ffdede', backgroundColor: '#fff' },
  logoutText: { color: '#d32b2b' },
  deleteBtn: { borderColor: '#ffdede', backgroundColor: '#fff' },
  deleteText: { color: '#cc2b2b' },

  refreshText: { color: '#6B4EFF', marginTop: 8 },
  debugToggle: { color: '#6B4EFF', marginTop: 6 },
  debugBox: { marginTop: 12, padding: 10, backgroundColor: '#fafafa', borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
  debugTitle: { fontWeight: '800', marginBottom: 6 },
  debugKey: { color: '#666', fontWeight: '700', marginTop: 6 },
  debugVal: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', marginTop: 6 },
  primaryBtn: { height: 46, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  primaryText: { color: '#6B4EFF', fontWeight: '800' },
});
