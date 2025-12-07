// App.js
import 'react-native-gesture-handler'; // must be first
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { navRef } from './src/navigation/navRef';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    // GestureHandlerRootView must wrap the whole app (NavigationContainer included)
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer ref={navRef}>
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
