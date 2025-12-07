import { initializeApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  browserLocalPersistence, // unused but kept for reference
  getReactNativePersistence,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---- Put your Firebase config here ----
const firebaseConfig = {
 apiKey: "AIzaSyBgWks-BgDu0Vq_ZJYnZ2gnDZislpLViXg",
  authDomain: "e-hub-6b68d.firebaseapp.com",
  projectId: "e-hub-6b68d",
  storageBucket: "e-hub-6b68d.firebasestorage.app",
  messagingSenderId: "469274380220",
  appId: "1:469274380220:web:5c727d4db5aeec372e0db9"
  // measurementId: 'G-XXXX' // optional
};

// Initialize app (regular)
const app = initializeApp(firebaseConfig);

// Initialize auth with React Native persistence so auth state persists between sessions.
// This is the recommended approach for RN per Firebase docs.
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (err) {
  // initializeAuth may throw if called multiple times (hot reload) — fall back to getAuth
  console.warn('initializeAuth failed, falling back to getAuth:', err?.message || err);
  auth = getAuth(app);
}

// Export app + auth
export { app, auth };
