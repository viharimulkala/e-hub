// src/screens/Signup.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firebase'; // adjust path if needed
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Signup({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email.trim() || password.length < 6) {
      Alert.alert('Validation', 'Enter a valid email and password (6+ chars).');
      return;
    }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = cred.user;
      const idToken = await user.getIdToken();

      await AsyncStorage.setItem('@ehub_token', idToken);
      await AsyncStorage.setItem('@ehub_user_v1', JSON.stringify({ uid: user.uid, email: user.email }));

      // Go to app
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs', params: { screen: 'Dashboard' } }] });
    } catch (err) {
      console.error('Signup error', err);
      let msg = 'Signup failed';
      if (err.code === 'auth/email-already-in-use') msg = 'Email already in use.';
      if (err.code === 'auth/invalid-email') msg = 'Invalid email.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create an account</Text>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} keyboardType="email-address" autoCapitalize="none" />
      <TextInput placeholder="Password (6+)" secureTextEntry value={password} onChangeText={setPassword} style={styles.input} />
      <TouchableOpacity onPress={handleSignup} style={styles.btn}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Sign up</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 12 }}>
        <Text style={{ color: '#1f6feb' }}>Back to login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, justifyContent:'center', padding:20 },
  title: { fontSize:20, fontWeight:'700', marginBottom:12 },
  input: { height:44, borderWidth:1, borderColor:'#e6e9ef', borderRadius:8, paddingHorizontal:12, marginBottom:12 },
  btn: { height:48, backgroundColor:'#1f6feb', borderRadius:10, justifyContent:'center', alignItems:'center' },
  btnText: { color:'#fff', fontWeight:'700' },
});
