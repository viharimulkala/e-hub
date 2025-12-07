// src/components/CustomDrawer.js
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function CustomDrawer({ isOpen, onClose, navigation }) {
  const drawerAnim = React.useRef(new Animated.Value(-width * 0.6)).current;

  React.useEffect(() => {
    Animated.timing(drawerAnim, {
      toValue: isOpen ? 0 : -width * 0.6,
      duration: 260,
      useNativeDriver: false,
    }).start();
  }, [isOpen]);

  return (
    <>
      {isOpen && (
        <TouchableOpacity
          style={styles.overlay}
          onPress={onClose}
          activeOpacity={1}
        />
      )}

      <Animated.View style={[styles.drawer, { left: drawerAnim }]}>
        <View style={styles.profileArea}>
          <Image
            source={{
              uri: 'file:///mnt/data/A_vector-based_digital_graphic_design_showcases_a_.png',
            }}
            style={styles.logo}
          />
          <Text style={styles.name}>Vihari</Text>
          <Text style={styles.role}>AIML Student</Text>
        </View>

        <View style={styles.menu}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              navigation.navigate('Dashboard');
              onClose();
            }}
          >
            <Ionicons name="grid" size={20} color="#6B4EFF" />
            <Text style={styles.menuText}>Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              navigation.navigate('Chat');
              onClose();
            }}
          >
            <Ionicons name="chatbubbles" size={20} color="#6B4EFF" />
            <Text style={styles.menuText}>Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              navigation.navigate('Roadmap');
              onClose();
            }}
          >
            <Ionicons name="map" size={20} color="#6B4EFF" />
            <Text style={styles.menuText}>Career Roadmaps</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              navigation.navigate('Profile');
              onClose();
            }}
          >
            <Ionicons name="person" size={20} color="#6B4EFF" />
            <Text style={styles.menuText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.28)',
    zIndex: 5,
  },
  drawer: {
    position: 'absolute',
    width: width * 0.6,
    height: '100%',
    backgroundColor: '#F8F5FF',
    paddingTop: 36,
    paddingHorizontal: 16,
    borderRightWidth: 1,
    borderColor: '#F0E9FF',
    zIndex: 10,
  },
  profileArea: { alignItems: 'center', marginBottom: 26 },
  logo: {
    width: 78,
    height: 78,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#EEE8FF',
    marginBottom: 10,
  },
  name: { fontSize: 18, color: '#35264A', fontWeight: '700' },
  role: { color: '#8E79B3', marginTop: 4 },
  menu: { marginTop: 12 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  menuText: {
    color: '#35264A',
    fontSize: 15,
    marginLeft: 12,
  },
});
