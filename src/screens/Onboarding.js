// src/screens/Onboarding.js
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const ONBOARD_KEY = '@ehub_onboard_seen';

const SLIDES = [
  { key: 's1', title: 'Welcome to E-Hub', text: 'Smart learning assistant — roadmaps, study plans and chatbot help.', emoji: '✨' },
  { key: 's2', title: 'Curated Roadmaps', text: 'Beginner → Intermediate → Advanced roadmaps for top domains.', emoji: '🧭' },
  { key: 's3', title: 'Ask & Learn', text: 'Chat with the bot, ask questions from PDFs, or get practice problems.', emoji: '💬' },
];

export default function Onboarding({ navigation }) {
  const [index, setIndex] = useState(0);
  const listRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // IMPORTANT: exactly one of itemVisiblePercentThreshold OR viewAreaCoveragePercentThreshold
  const viewabilityConfigRef = useRef({ itemVisiblePercentThreshold: 50 });

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) setIndex(viewableItems[0].index);
  }).current;

  const finish = async () => {
    try {
      await AsyncStorage.setItem(ONBOARD_KEY, '1');
    } catch (e) {
      console.warn('Onboarding: failed to save key', e);
    }
    // go to tab navigator root (Courses tab will be shown by TabNavigator's initialRouteName)
    navigation.replace('MainTabs');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F5FF" />
      <View style={{ flex: 1 }}>
        <FlatList
          ref={listRef}
          data={SLIDES}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(i) => i.key}
          renderItem={({ item }) => (
            <View style={[styles.slide, { width }]}>
              <View style={styles.emojiWrap}>
                <Text style={styles.emoji}>{item.emoji}</Text>
              </View>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.text}>{item.text}</Text>
            </View>
          )}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
          viewabilityConfig={viewabilityConfigRef.current}
          onViewableItemsChanged={onViewableItemsChanged}
        />
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>

        <View style={styles.footerRow}>
          <TouchableOpacity onPress={() => navigation.replace('MainTabs')}>
            <Text style={styles.skip}>Skip</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.getBtn} onPress={finish}>
            <Text style={styles.getText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FCFBFF' },
  slide: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  emojiWrap: { width: 160, height: 160, borderRadius: 20, backgroundColor: '#F4F1FF', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emoji: { fontSize: 64 },
  title: { fontSize: 22, fontWeight: '900', color: '#2D2347', textAlign: 'center' },
  text: { marginTop: 12, color: '#6E5A8A', textAlign: 'center' },
  footer: { padding: 18 },
  dots: { flexDirection: 'row', justifyContent: 'center', marginBottom: 12 },
  dot: { width: 8, height: 8, borderRadius: 8, backgroundColor: '#EAE6FF', marginHorizontal: 6 },
  dotActive: { width: 20, backgroundColor: '#6B4EFF' },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  skip: { color: '#8570A8' },
  getBtn: { backgroundColor: '#6B4EFF', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  getText: { color: '#fff', fontWeight: '800' },
});
