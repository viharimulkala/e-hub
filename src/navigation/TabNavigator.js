// src/navigation/TabNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Dashboard from '../screens/Dashboard';
import ChatScreen from '../screens/ChatScreen';
import Roadmap from '../screens/Roadmap';
import Profile from '../screens/Profile';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#6B4EFF',
        tabBarInactiveTintColor: '#9AA4B2',
        tabBarStyle: { height: 62, paddingBottom: 6, paddingTop: 6, backgroundColor: '#fff', borderTopColor: '#EEE6FF' },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarIcon: ({ color, size }) => {
          let icon = 'home-outline';
          if (route.name === 'Dashboard') icon = 'home-outline';
          else if (route.name === 'Chat') icon = 'chatbubble-ellipses-outline';
          else if (route.name === 'Roadmap') icon = 'map-outline';
          else if (route.name === 'Profile') icon = 'person-circle-outline';
          return <Ionicons name={icon} size={size ?? 22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={Dashboard} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Roadmap" component={Roadmap} />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
}
