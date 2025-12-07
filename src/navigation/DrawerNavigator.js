// src/navigation/DrawerNavigator.js
import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import TabNavigator from './TabNavigator';
import Profile from '../screens/Profile';
import Roadmap from '../screens/Roadmap';
import Dashboard from '../screens/Dashboard';

const Drawer = createDrawerNavigator();

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerStyle: { backgroundColor: '#0b1220' },
        drawerActiveTintColor: '#3b82f6',
        drawerInactiveTintColor: '#cbd5e1',
      }}
    >
      <Drawer.Screen name="Home" component={TabNavigator} />
      <Drawer.Screen name="Dashboard" component={Dashboard} />
      <Drawer.Screen name="Roadmaps" component={Roadmap} />
      <Drawer.Screen name="Profile" component={Profile} />
    </Drawer.Navigator>
  );
}
