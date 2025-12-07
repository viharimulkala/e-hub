import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
const UPLOADED_IMAGE = require("../../assets/Logo.jpg");
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function Dashboard({ navigation, openDrawer }) {
  const actions = [
    {
      key: 'ask',
      title: 'Ask AI',
      sub: 'Personalised career help',
      icon: 'chatbubble-ellipses-outline',
      to: () => navigation.navigate('Chat'),
    },
    {
      key: 'roadmaps',
      title: 'Roadmaps',
      sub: 'Step-by-step learning paths',
      icon: 'map-outline',
      to: () => navigation.navigate('Roadmap'),
    },
    {
      key: 'profile',
      title: 'Profile',
      sub: 'View your progress',
      icon: 'person-circle-outline',
      to: () => navigation.navigate('Profile'),
    },
    {
      key: 'recent',
      title: 'Recent Chats',
      sub: 'Resume conversation',
      icon: 'timer-outline',
      to: () => navigation.navigate('Chat'),
    },
  ];

  // index of the currently visible action card
  const [index, setIndex] = useState(0);

  // animated value which represents the current index (can be fractional during animation)
  const anim = useRef(new Animated.Value(0)).current; // holds numeric index

  // hero card animations
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroTranslate = useRef(new Animated.Value(10)).current;
  const heroScale = useRef(new Animated.Value(0.98)).current;

  useEffect(() => {
    // entrance sequence: fade+slide hero in with a small scale pop
    Animated.parallel([
      Animated.timing(heroOpacity, { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.timing(heroTranslate, { toValue: 0, duration: 360, useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(heroScale, { toValue: 1.05, duration: 180, useNativeDriver: true }),
        Animated.spring(heroScale, { toValue: 1, friction: 8, tension: 120, useNativeDriver: true }),
      ]),
      // keep anim at index 0 (no movement) -- ensures interpolations work
      Animated.timing(anim, { toValue: 0, duration: 1, useNativeDriver: true }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // navigate to next index (wraps). We animate `anim` from current value to `next`.
  const showIndex = (next) => {
    if (next === index) return;
    Animated.timing(anim, {
      toValue: next,
      duration: 360,
      useNativeDriver: true,
    }).start(() => {
      // setIndex after animation to keep non-animated state in sync
      setIndex(next);
    });
  };

  const next = () => showIndex((index + 1) % actions.length);
  const prev = () => showIndex((index - 1 + actions.length) % actions.length);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F5FF" />

      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={openDrawer} style={styles.menuButton} activeOpacity={0.8}>
          <Ionicons name="menu" size={24} color="#6B4EFF" />
        </TouchableOpacity>

        <View style={styles.headerRight}>
          <View style={styles.logoPlaceholder} />

          <View style={{ marginLeft: 12, flexShrink: 1 }}>
            <Animated.Text
              accessible
              accessibilityRole="header"
              style={[
                styles.title,
                { opacity: heroOpacity, transform: [{ translateY: heroTranslate }, { scale: heroScale }] },
              ]}
            >
              Welcome to E-Hub
            </Animated.Text>

            <Animated.Text style={[styles.subtitle, { opacity: heroOpacity, transform: [{ translateY: heroTranslate }] }]}> 
              Calm guidance for your career journey
            </Animated.Text>
          </View>
        </View>
      </View>

      {/* Large hero card with gentle floating animation */}
      <Animated.View
        style={[
          styles.heroCard,
          {
            opacity: heroOpacity,
            transform: [
              { translateY: heroTranslate },
              // subtle breathing animation by mapping heroScale
              { scale: heroScale },
            ],
          },
        ]}
      >
        <Text style={styles.heroTitle}>Hi there 👋</Text>
        <Text style={styles.heroSubtitle}>
          I'm E‑Hub — your companion for learning paths, practical projects, and quick career advice. Tap the
          action card below to proceed.
        </Text>
      </Animated.View>

      {/* Center action area: animated single card carousel */}
      <View style={styles.centerArea}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <View style={styles.actionViewport}>
          {actions.map((act, i) => {
            // translateX: depends on distance from animated index value
            const translateX = anim.interpolate({
              inputRange: [i - 1, i, i + 1],
              outputRange: [SCREEN_WIDTH * 0.9, 0, -SCREEN_WIDTH * 0.9],
              extrapolate: 'clamp',
            });

            const opacity = anim.interpolate({
              inputRange: [i - 0.7, i, i + 0.7],
              outputRange: [0, 1, 0],
              extrapolate: 'clamp',
            });

            const scale = anim.interpolate({
              inputRange: [i - 1, i, i + 1],
              outputRange: [0.96, 1, 0.96],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View
                key={act.key}
                style={[
                  styles.singleActionCard,
                  { transform: [{ translateX }, { scale }], opacity },
                ]}
              >
                <TouchableOpacity activeOpacity={0.88} style={{ flex: 1 }} onPress={act.to}>
                  <LinearGradient colors={['#EAD7FF', '#E9F0FF']} style={styles.singleActionInner}>
                    <Ionicons name={act.icon} size={28} color="#6B4EFF" />
                    <Text style={styles.singleActionTitle}>{act.title}</Text>
                    <Text style={styles.singleActionSub}>{act.sub}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* controls: prev / index dots / next */}
        <View style={styles.controlsRow}>
          <TouchableOpacity style={styles.iconBtn} onPress={prev} activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={22} color="#6B4EFF" />
          </TouchableOpacity>

          <View style={styles.dotsRow}>
            {actions.map((_, i) => {
              // animate dot scale/opacity from anim
              const dotOpacity = anim.interpolate({ inputRange: [i - 0.5, i, i + 0.5], outputRange: [0.4, 1, 0.4], extrapolate: 'clamp' });
              const dotScale = anim.interpolate({ inputRange: [i - 0.5, i, i + 0.5], outputRange: [0.8, 1.3, 0.8], extrapolate: 'clamp' });

              return (
                <Animated.View key={i} style={[styles.dot, { opacity: dotOpacity, transform: [{ scale: dotScale }] }]} />
              );
            })}
          </View>

          <TouchableOpacity style={styles.iconBtn} onPress={next} activeOpacity={0.8}>
            <Ionicons name="chevron-forward" size={22} color="#6B4EFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F5FF', padding: 18 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  menuButton: {
    padding: 8,
    marginRight: 8,
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ECE7FF',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingHorizontal: 4 },
  logoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#EEE8FF',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
  },
  title: { color: '#2D2347', fontSize: 18, fontWeight: '700' },
  subtitle: { color: '#6E5A8A', fontSize: 13, marginTop: 2 },

  // hero card
  heroCard: {
    backgroundColor: '#fff',
    padding: 26,
    borderRadius: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E9E2FF',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 3,
  },
  heroTitle: { fontSize: 22, fontWeight: '700', color: '#2D2347', marginBottom: 10 },
  heroSubtitle: { color: '#6E5A8A', fontSize: 15, lineHeight: 22 },

  centerArea: { marginTop: 6 },
  sectionTitle: { color: '#35264A', fontSize: 15, fontWeight: '700', marginBottom: 12 },

  actionViewport: {
    height: 160,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  singleActionCard: {
    position: 'absolute',
    width: '96%',
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
  },

  singleActionInner: {
    flex: 1,
    padding: 22,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E9E2FF',
    justifyContent: 'center',
  },
  singleActionTitle: { color: '#2D2347', fontSize: 18, fontWeight: '700', marginTop: 12 },
  singleActionSub: { color: '#8E79B3', fontSize: 14, marginTop: 6 },

  controlsRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  iconBtn: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9E2FF',
  },
  dotsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 6, backgroundColor: '#EDE6FF', marginHorizontal: 6 },
  dotActive: { backgroundColor: '#6B4EFF', width: 12, height: 12, borderRadius: 8 },
});
