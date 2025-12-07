// src/screens/ForgotPassword.js
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, Alert } from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase/firebase';

export default function ForgotPassword({ navigation }) {
  const [email, setEmail] = useState('');

  const handleReset = async () => {
    if (!email) { Alert.alert('Enter your email'); return; }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert('Password reset', 'Check your email for reset link.');
      navigation.goBack();
    } catch (err) {
      console.error('Reset error', err);
      Alert.alert('Error', 'Unable to send reset email.');
    }
  };

  return (
    <View style={{flex:1,justifyContent:'center',padding:20}}>
      <TextInput placeholder="Your email" value={email} onChangeText={setEmail} style={{height:44,borderWidth:1,borderRadius:8,padding:10,marginBottom:12}} />
      <TouchableOpacity onPress={handleReset} style={{height:48,backgroundColor:'#1f6feb',borderRadius:10,alignItems:'center',justifyContent:'center'}}>
        <Text style={{color:'#fff',fontWeight:'700'}}>Send reset email</Text>
      </TouchableOpacity>
    </View>
  );
}
