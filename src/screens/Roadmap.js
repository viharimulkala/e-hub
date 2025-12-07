// src/screens/RoadmapJourneyMap.js
// Lavender-gradient course grid (2 columns) with glass-like cards that match dashboard quick-action cards.
// Staggered entrance animations, tap-to-open roadmap, colored completion bar (red/yellow/green).

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Alert,
  ScrollView,
  FlatList,
  TextInput,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// optional LinearGradient from expo; fallback to View
let LinearGradient = null;
try {
  // eslint-disable-next-line import/no-extraneous-dependencies,global-require
  LinearGradient = require('expo-linear-gradient').LinearGradient;
} catch (e) {
  LinearGradient = null;
}

const STORAGE_KEY = '@ehub_journey_progress_v2';
const { width } = Dimensions.get('window');

const WRITE_DEBOUNCE = 250; // ms
const percent = (num, den) => (den === 0 ? 0 : Math.round((num / den) * 100));

// ---------- Sizes ----------
const CIRCLE_SIZE = 170;
const OUTER_SIZE = CIRCLE_SIZE;
const OUTER_BORDER = Math.max(6, Math.round(CIRCLE_SIZE * 0.07));
const GRID_PADDING = 16;
const CARD_GAP = 12;
const CARD_SIZE = Math.round((width - GRID_PADDING * 2 - CARD_GAP) / 2); // two columns
const NODE_CARD_WIDTH = Math.max(260, width - 160);

// ---------- ROADMAPS (with emojis for courses) ----------
const ROADMAPS = {
  'AI & ML': { title: 'AI · Machine Learning', emoji: '🤖', levels: [
    { level: 'Beginner', steps: [{ id: 'ai_b1', label: 'Python for ML' }, { id: 'ai_b2', label: 'Linear Algebra' }, { id: 'ai_b3', label: 'Intro to ML' }] },
    { level: 'Intermediate', steps: [{ id: 'ai_i1', label: 'Deep Learning Basics' }, { id: 'ai_i2', label: 'Model Evaluation' }, { id: 'ai_i3', label: 'NLP Intro' }] },
    { level: 'Advanced', steps: [{ id: 'ai_a1', label: 'Production ML' }, { id: 'ai_a2', label: 'Research & Papers' }] },
  ]},
  'Web Development': { title: 'Web Development', emoji: '🌐', levels: [
    { level: 'Beginner', steps: [{ id: 'web_b1', label: 'HTML & CSS' }, { id: 'web_b2', label: 'JavaScript Fundamentals' }] },
    { level: 'Intermediate', steps: [{ id: 'web_i1', label: 'React & Hooks' }, { id: 'web_i2', label: 'State Management' }] },
    { level: 'Advanced', steps: [{ id: 'web_a1', label: 'Performance & Security' }] },
  ]},
  'Cloud Engineering': { title: 'Cloud Engineering', emoji: '☁️', levels: [
    { level: 'Beginner', steps: [{ id: 'cloud_b1', label: 'Cloud Concepts' }] },
    { level: 'Intermediate', steps: [{ id: 'cloud_i1', label: 'Docker & Containers' }, { id: 'cloud_i2', label: 'Infrastructure as Code' }] },
    { level: 'Advanced', steps: [{ id: 'cloud_a1', label: 'Kubernetes' }] },
  ]},
  'Cybersecurity': { title: 'Cybersecurity', emoji: '🔒', levels: [
    { level: 'Beginner', steps: [{ id: 'sec_b1', label: 'Security Basics' }] },
    { level: 'Intermediate', steps: [{ id: 'sec_i1', label: 'Networking Fundamentals' }, { id: 'sec_i2', label: 'Web Security (OWASP)' }] },
    { level: 'Advanced', steps: [{ id: 'sec_a1', label: 'Pen-testing Basics' }] },
  ]},
  'Data Science': { title: 'Data Science', emoji: '📊', levels: [
    { level: 'Beginner', steps: [{ id: 'ds_b1', label: 'Pandas & EDA' }, { id: 'ds_b2', label: 'Statistics Basics' }] },
    { level: 'Intermediate', steps: [{ id: 'ds_i1', label: 'Feature Engineering' }, { id: 'ds_i2', label: 'Modeling' }] },
    { level: 'Advanced', steps: [{ id: 'ds_a1', label: 'Big Data & Spark' }] },
  ]},
  'Mobile Development': { title: 'Mobile Development', emoji: '📱', levels: [
    { level: 'Beginner', steps: [{ id: 'mob_b1', label: 'React Native Basics' }] },
    { level: 'Intermediate', steps: [{ id: 'mob_i1', label: 'Navigation & State' }] },
    { level: 'Advanced', steps: [{ id: 'mob_a1', label: 'Performance & CI' }] },
  ]},
  'DevOps': { title: 'DevOps', emoji: '⚙️', levels: [
    { level: 'Beginner', steps: [{ id: 'dev_b1', label: 'Git & CI Basics' }] },
    { level: 'Intermediate', steps: [{ id: 'dev_i1', label: 'CI/CD Pipelines' }, { id: 'dev_i2', label: 'Monitoring' }] },
    { level: 'Advanced', steps: [{ id: 'dev_a1', label: 'Auto-scaling & Observability' }] },
  ]},
  'UI/UX Design': { title: 'UI/UX Design', emoji: '🎨', levels: [
    { level: 'Beginner', steps: [{ id: 'ux_b1', label: 'Design Principles' }] },
    { level: 'Intermediate', steps: [{ id: 'ux_i1', label: 'Prototyping (Figma)' }] },
    { level: 'Advanced', steps: [{ id: 'ux_a1', label: 'Design Systems' }] },
  ]},
  'Blockchain': { title: 'Blockchain', emoji: '🔗', levels: [
    { level: 'Beginner', steps: [{ id: 'bc_b1', label: 'Crypto Basics' }] },
    { level: 'Intermediate', steps: [{ id: 'bc_i1', label: 'Smart Contracts' }] },
    { level: 'Advanced', steps: [{ id: 'bc_a1', label: 'Scaling & Security' }] },
  ]},
  'Computer Vision': { title: 'Computer Vision', emoji: '🖼️', levels: [
    { level: 'Beginner', steps: [{ id: 'cv_b1', label: 'Image Processing' }] },
    { level: 'Intermediate', steps: [{ id: 'cv_i1', label: 'CNNs & Transfer Learning' }] },
    { level: 'Advanced', steps: [{ id: 'cv_a1', label: 'Detection & Segmentation' }] },
  ]},
  'Natural Language Processing': { title: 'Natural Language Processing', emoji: '🗣️', levels: [
    { level: 'Beginner', steps: [{ id: 'nlp_b1', label: 'Text Preprocessing' }] },
    { level: 'Intermediate', steps: [{ id: 'nlp_i1', label: 'Sequence Models' }] },
    { level: 'Advanced', steps: [{ id: 'nlp_a1', label: 'Transformers & LLMs' }] },
  ]},
  'Robotics': { title: 'Robotics', emoji: '🤖', levels: [
    { level: 'Beginner', steps: [{ id: 'rb_b1', label: 'Electronics Basics' }] },
    { level: 'Intermediate', steps: [{ id: 'rb_i1', label: 'Control Systems' }] },
    { level: 'Advanced', steps: [{ id: 'rb_a1', label: 'Autonomous Systems' }] },
  ]},
  // Programming languages added earlier
  'Python': { title: 'Python Programming', emoji: '🐍', levels: [
    { level: 'Beginner', steps: [{ id: 'py_b1', label: 'Python Syntax & Basics' }, { id: 'py_b2', label: 'Data Types & Control Flow' }] },
    { level: 'Intermediate', steps: [{ id: 'py_i1', label: 'Modules & OOP' }, { id: 'py_i2', label: 'File I/O & Testing' }] },
    { level: 'Advanced', steps: [{ id: 'py_a1', label: 'Async & Performance' }, { id: 'py_a2', label: 'Packaging & Deployment' }] },
  ]},
  'Java': { title: 'Java Programming', emoji: '☕', levels: [
    { level: 'Beginner', steps: [{ id: 'java_b1', label: 'Java Basics & Syntax' }, { id: 'java_b2', label: 'OOP Concepts' }] },
    { level: 'Intermediate', steps: [{ id: 'java_i1', label: 'Collections & Generics' }, { id: 'java_i2', label: 'Concurrency Basics' }] },
    { level: 'Advanced', steps: [{ id: 'java_a1', label: 'JVM Tuning & Performance' }, { id: 'java_a2', label: 'Spring Framework Intro' }] },
  ]},
  'C++': { title: 'C++ Programming', emoji: '🧩', levels: [
    { level: 'Beginner', steps: [{ id: 'cpp_b1', label: 'C++ Syntax & Basics' }, { id: 'cpp_b2', label: 'Pointers & Memory' }] },
    { level: 'Intermediate', steps: [{ id: 'cpp_i1', label: 'STL & Templates' }, { id: 'cpp_i2', label: 'Object-Oriented C++' }] },
    { level: 'Advanced', steps: [{ id: 'cpp_a1', label: 'Concurrency & Performance' }, { id: 'cpp_a2', label: 'Modern C++ (C++11+)' }] },
  ]},
  'C': { title: 'C Programming', emoji: '🔌', levels: [
    { level: 'Beginner', steps: [{ id: 'c_b1', label: 'C Basics & Syntax' }, { id: 'c_b2', label: 'Variables, Loops & Conditions' }] },
    { level: 'Intermediate', steps: [{ id: 'c_i1', label: 'Pointers & Memory Management' }, { id: 'c_i2', label: 'Functions & Modular Programming' }] },
    { level: 'Advanced', steps: [{ id: 'c_a1', label: 'Structures & File Handling' }, { id: 'c_a2', label: 'Advanced Memory & Optimization' }] },
  ]},
};

// ---------- Helpers ----------
function flattenLevels(domainObj) {
  const out = [];
  (domainObj.levels || []).forEach((lvl) => {
    (lvl.steps || []).forEach((s) => out.push({ ...s, level: lvl.level }));
  });
  return out;
}
function totalStepsForDomain(domainObj) {
  return (domainObj.levels || []).reduce((acc, lvl) => acc + ((lvl.steps || []).length), 0);
}
function stepIdsForDomain(domainObj) {
  return (domainObj.levels || []).flatMap((lvl) => (lvl.steps || []).map((s) => s.id));
}
function levelEmoji(level) {
  if (!level) return '•';
  if (level.toLowerCase().includes('begin')) return '🔰';
  if (level.toLowerCase().includes('inter')) return '⚙️';
  return '🏁'; // advanced
}
function stageColorForPct(pct) {
  if (pct >= 100) return '#4CAF50';
  if (pct >= 34) return '#F2C94C';
  return '#FF7A7A';
}

// ---------- Animated Progress Bar component (outside card) ----------
function CourseProgressBarColored({ pct }) {
  // pct expected 0..100
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: Math.min(100, Math.max(0, pct || 0)),
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // width interpolation uses layout -> false
    }).start();
  }, [pct, anim]);

  const widthAnim = anim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const barColor = stageColorForPct(pct);

  return (
    <View style={listStyles.progressWrap}>
      <View style={listStyles.progressTrack}>
        <Animated.View style={[listStyles.progressFill, { width: widthAnim, backgroundColor: barColor }]} />
      </View>
      <Text style={listStyles.progressLabel}>{Math.round(pct ?? 0)}%</Text>
    </View>
  );
}

// ---------- Circle Tracker (no emoji inside) ----------
function CircleTracker({ completed, total, title }) {
  const pct = percent(completed, total);
  let ringColor = '#FFCDD2';
  if (pct >= 100) ringColor = '#4CAF50';
  else if (pct >= 34) ringColor = '#F2C94C';

  return (
    <View style={trackerStyles.container}>
      <View style={[trackerStyles.outerRing, { borderColor: ringColor, borderWidth: OUTER_BORDER }]}>
        <Text style={trackerStyles.titleInside} numberOfLines={2}>{title}</Text>
        <Text style={trackerStyles.pctText}>{pct}%</Text>
        <Text style={trackerStyles.countText}>{completed}/{total}</Text>
      </View>
    </View>
  );
}

const trackerStyles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  outerRing: {
    width: OUTER_SIZE,
    height: OUTER_SIZE,
    borderRadius: OUTER_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FCFBFF',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 4,
  },
  titleInside: { fontSize: Math.round(CIRCLE_SIZE / 12), fontWeight: '800', color: '#2D2347', textAlign: 'center' },
  pctText: { fontSize: Math.round(CIRCLE_SIZE / 9), fontWeight: '900', color: '#2D2347', marginTop: 6 },
  countText: { fontSize: Math.round(CIRCLE_SIZE / 18), color: '#8570A8', marginTop: 2 },
});

// ---------- Component ----------
export default function RoadmapJourneyMap({ route }) {
  const domains = Object.keys(ROADMAPS).sort((a, b) => a.localeCompare(b));
  const initialDomain = (route?.params?.domain) ?? null;

  const [selectedDomain, setSelectedDomain] = useState(initialDomain);
  const domainObj = selectedDomain ? ROADMAPS[selectedDomain] : null;
  const steps = useMemo(() => (domainObj ? flattenLevels(domainObj) : []), [selectedDomain]);

  const [progress, setProgress] = useState({});
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef(null);

  const [query, setQuery] = useState('');

  // animations for roadmap view
  const roadmapOpacity = useRef(new Animated.Value(selectedDomain ? 1 : 0)).current;
  const roadmapTranslateY = useRef(new Animated.Value(selectedDomain ? 0 : 20)).current;
  const trackerScale = useRef(new Animated.Value(selectedDomain ? 1 : 0.95)).current;

  // entrance animated values for grid items: each item has { entry, pressScale, bounce, float }
  const gridAnimRef = useRef([]); // store per-item Animated.Value objects
  const gridAnim = gridAnimRef.current;

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setProgress(JSON.parse(raw));
      } catch (e) {
        console.warn('JourneyMap: load error', e);
      } finally {
        setLoaded(true);
      }
    })();
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      } catch (e) {
        console.warn('JourneyMap: save error', e);
      }
    }, WRITE_DEBOUNCE);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [progress, loaded]);

  useEffect(() => {
    const toValue = selectedDomain ? 1 : 0;
    Animated.parallel([
      Animated.timing(roadmapOpacity, { toValue, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(roadmapTranslateY, { toValue: selectedDomain ? 0 : 20, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(trackerScale, { toValue: selectedDomain ? 1 : 0.95, duration: 260, useNativeDriver: true }),
    ]).start();
  }, [selectedDomain, roadmapOpacity, roadmapTranslateY, trackerScale]);

  useEffect(() => {
    if (route?.params?.domain) setSelectedDomain(route.params.domain);
  }, [route?.params?.domain]);

  const completedCount = useMemo(() => steps.filter((s) => progress[s.id]?.done).length, [progress, steps]);

  const toggleDone = (id) => {
    setProgress((p) => ({ ...p, [id]: { ...(p[id] || {}), done: !p[id]?.done, ts: Date.now() } }));
  };
  const toggleBookmark = (id) => {
    setProgress((p) => ({ ...p, [id]: { ...(p[id] || {}), bookmarked: !p[id]?.bookmarked, ts: Date.now() } }));
  };

  const resetDomain = () => {
    if (!selectedDomain) return;
    Alert.alert('Reset progress', `Clear progress for ${selectedDomain}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          const next = { ...progress };
          steps.forEach((s) => delete next[s.id]);
          setProgress(next);
          try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          } catch {}
        },
      },
    ]);
  };

  // LIST (grid) data
  const courses = useMemo(() => {
    return domains
      .map((key) => {
        const d = ROADMAPS[key];
        const total = totalStepsForDomain(d);
        const ids = stepIdsForDomain(d);
        const completed = ids.filter((id) => progress[id]?.done).length;
        const pct = percent(completed, total);
        return { id: key, title: d.title || key, total, completed, pct, emoji: d.emoji || '📚' };
      })
      .filter((c) => c.title.toLowerCase().includes(query.toLowerCase()));
  }, [progress, query]);

  // prepare gridAnim values matching courses length (recreate when courses length changes)
  useEffect(() => {
    // create per-item animation objects
    gridAnimRef.current = courses.map(() => ({
      entry: new Animated.Value(0),
      pressScale: new Animated.Value(1),
      bounce: new Animated.Value(0),
      float: new Animated.Value(0),
    }));

    // stagger entrance then run a small bounce/pop animation for each card
    const entryAnims = gridAnimRef.current.map((v, i) =>
      Animated.sequence([
        Animated.delay(i * 60),
        Animated.parallel([
          Animated.timing(v.entry, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.spring(v.bounce, { toValue: 1, friction: 7, tension: 50, useNativeDriver: true }),
        ]),
      ])
    );

    Animated.stagger(40, entryAnims).start(() => {
      // after entrance, gently relax bounce back to 0
      gridAnimRef.current.forEach((v, i) => {
        Animated.timing(v.bounce, { toValue: 0, duration: 600, delay: i * 10, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
      });

      // start subtle floating loops for each card to give an overall floating feel
      gridAnimRef.current.forEach((v, i) => {
        // small vertical float: -6 -> 0 -> 6 -> 0 loop
        const floatSeq = Animated.sequence([
          Animated.timing(v.float, { toValue: -6, duration: 2200 + (i % 3) * 200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(v.float, { toValue: 0, duration: 1800 + (i % 2) * 300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(v.float, { toValue: 6, duration: 2000 + (i % 2) * 250, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(v.float, { toValue: 0, duration: 1800 + (i % 3) * 200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]);
        Animated.loop(floatSeq).start();
      });
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courses.length]);

  const onSelectCourse = (id) => setSelectedDomain(id);

  // If no selectedDomain => show grid
  if (!selectedDomain) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.headerList}>
          <Text style={styles.headerTitle}>All Courses</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search courses..."
            style={styles.search}
            clearButtonMode="while-editing"
          />
        </View>

        <FlatList
          data={courses}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: GRID_PADDING }}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: CARD_GAP }}
          renderItem={({ item, index }) => {
            // lavender gradient used in your dashboard quick actions
            const lavender = ['#F7F3FF', '#EFE9FF'];
            const CardWrapper = LinearGradient ? LinearGradient : View;
            const wrapperProps = LinearGradient ? { colors: lavender, start: [0, 0], end: [1, 1] } : { style: { backgroundColor: lavender[0] } };

            // use pre-created animations (no hooks here)
            const anim = gridAnim[index] ?? { entry: new Animated.Value(1), pressScale: new Animated.Value(1), bounce: new Animated.Value(0), float: new Animated.Value(0) };
            const entryVal = anim.entry;
            const pressScale = anim.pressScale;
            const bounce = anim.bounce;
            const float = anim.float;

            const translateEntry = entryVal.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });

            const animatedStyle = {
              opacity: entryVal,
              transform: [
                { translateY: Animated.add(translateEntry, float) },
                { scale: Animated.add(1, bounce.interpolate({ inputRange: [0, 1], outputRange: [0, 0.02] })) },
                { scale: pressScale },
              ],
            };

            return (
              <Animated.View style={[{ width: CARD_SIZE }, animatedStyle]} key={item.id}>
                <TouchableOpacity
                  activeOpacity={0.95}
                  onPress={() => {
                    // tap feedback using pre-created pressScale
                    Animated.sequence([
                      Animated.timing(pressScale, { toValue: 0.96, duration: 90, useNativeDriver: true }),
                      Animated.timing(pressScale, { toValue: 1, duration: 160, useNativeDriver: true }),
                    ]).start();
                    onSelectCourse(item.id);
                  }}
                >
                  {/* Removed inner white box: content is placed directly into the gradient card to achieve glassy floating look */}
                  <CardWrapper {...wrapperProps} style={[listStyles.card, styles.lavenderCard, { width: CARD_SIZE, height: CARD_SIZE * 0.78 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 }}>
                      <View style={styles.leftCol}>
                        <Text style={listStyles.cardTitleSmall} numberOfLines={2}>{item.title}</Text>
                        <Text style={styles.cardSubtitle}>{item.completed}/{item.total} • {item.pct}%</Text>
                      </View>

                      <View style={styles.rightCol}>
                        <Text style={listStyles.courseEmoji}>{item.emoji}</Text>
                      </View>
                    </View>
                  </CardWrapper>
                </TouchableOpacity>

                {/* PROGRESS BAR OUTSIDE THE CARD (aligned to same width) */}
                <View style={{ width: CARD_SIZE, marginTop: 8 }}>
                  <CourseProgressBarColored pct={item.pct} />
                </View>
              </Animated.View>
            );
          }}
          ListEmptyComponent={() => <View style={{ padding: 24 }}><Text style={{ color: '#8570A8' }}>No courses found.</Text></View>}
        />
      </SafeAreaView>
    );
  }

  // ROADMAP VIEW
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => setSelectedDomain(null)} style={styles.backBtn}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{domainObj.title}</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={[styles.headerBtn, { marginLeft: 8 }]} onPress={resetDomain}>
            <Text style={styles.headerBtnText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Animated.View style={[styles.content, {
        opacity: roadmapOpacity,
        transform: [{ translateY: roadmapTranslateY }],
      }]}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.nodesColumn}>
            <Animated.View style={{ transform: [{ scale: trackerScale }] }}>
              <CircleTracker completed={completedCount} total={steps.length} title={domainObj.title} />
            </Animated.View>

            {(() => {
              const levels = domainObj.levels || [];
              const out = [];
              let globalIndex = 0;
              levels.forEach((lvl) => {
                out.push(
                  <View key={`lvl-${lvl.level}`} style={styles.levelHeader}>
                    <Text style={styles.levelHeaderText}>{lvl.level}</Text>
                  </View>
                );
                (lvl.steps || []).forEach((s) => {
                  const st = progress[s.id] || {};
                  const idx = globalIndex;
                  // step-level progress: simple binary progress for single-step items (100 if done, 0 otherwise).
                  const stepPct = st.done ? 100 : 0;
                  out.push(
                    <View key={s.id} style={styles.nodeRow}>
                      <View style={styles.nodeBadge}>
                        <Text style={styles.nodeEmoji}>{levelEmoji(lvl.level)}</Text>
                      </View>

                      <View style={[styles.card, st.done && styles.cardDone]}>
                        <Text style={[styles.cardTitle, st.done && styles.cardTitleDone]}>{s.label}</Text>
                        <Text style={styles.cardLevel}>{lvl.level}</Text>

                        {/* added completion bar inside each roadmap step card */}
                        <View style={{ marginTop: 10 }}>
                          <CourseProgressBarColored pct={stepPct} />
                        </View>

                        <View style={styles.cardActions}>
                          <TouchableOpacity style={[styles.actionMark, st.done && styles.actionMarkActive]} onPress={() => toggleDone(s.id)}>
                            <Text style={[styles.actionMarkText, st.done && styles.actionMarkTextActive]}>{st.done ? 'Done ✓' : 'Mark'}</Text>
                          </TouchableOpacity>

                          <TouchableOpacity style={styles.actionBookmark} onPress={() => toggleBookmark(s.id)}>
                            <Text style={[styles.bookmarkText, st.bookmarked && styles.bookmarkTextActive]}>{st.bookmarked ? '★ Bookmarked' : '☆ Bookmark'}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                  globalIndex += 1;
                });
              });
              out.push(<View key="bottom-space" style={{ height: 48 }} />);
              return out;
            })()}
          </View>
        </ScrollView>
      </Animated.View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Tip: mark steps done to advance your progress.</Text>
      </View>
    </SafeAreaView>
  );
}

// ---------- Styles ----------
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FBF9FF' },

  // list header
  headerList: { paddingHorizontal: GRID_PADDING, paddingTop: 12 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#2D2347', marginBottom: 8 },

  search: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0E9FF',
  },

  header: {
    height: 72,
    paddingHorizontal: GRID_PADDING,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  backBtn: { marginRight: 12, paddingHorizontal: 8, paddingVertical: 4 },
  backText: { fontSize: 28, color: '#6B4EFF', fontWeight: '900' },

  title: { fontSize: 18, fontWeight: '800', color: '#2D2347', marginTop: 6, marginLeft: 4 },

  headerRight: { flexDirection: 'row', alignItems: 'center' },
  headerBtn: { backgroundColor: '#6B4EFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  headerBtnText: { color: '#fff', fontWeight: '700' },

  content: { flex: 1, paddingHorizontal: 12, paddingBottom: 16 },
  scrollContent: { paddingVertical: 12 },

  nodesColumn: { flex: 1, paddingLeft: 6, paddingRight: 6, alignItems: 'center' },

  levelHeader: { width: '100%', paddingLeft: 6, marginBottom: 8, marginTop: 6 },
  levelHeaderText: { fontSize: 13, fontWeight: '900', color: '#37284A' },

  nodeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, width: '100%' },
  nodeBadge: { width: 48, alignItems: 'center', marginRight: 10 },
  nodeEmoji: { fontSize: 20 },

  card: {
    width: NODE_CARD_WIDTH,
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0E9FF',
  },
  cardDone: { backgroundColor: '#F4F1FF', borderColor: '#E6DFFF' },

  cardTitle: { fontSize: 16, fontWeight: '800', color: '#2D2347' },
  cardTitleDone: { textDecorationLine: 'line-through', color: '#A79AD0' },

  cardLevel: { fontSize: 12, color: '#8570A8', marginTop: 6 },

  cardActions: { flexDirection: 'row', marginTop: 10, alignItems: 'center' },
  actionMark: { backgroundColor: '#F4F1FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  actionMarkActive: { backgroundColor: '#6B4EFF' },
  actionMarkText: { fontWeight: '800', color: '#35264A' },
  actionMarkTextActive: { color: '#fff' },

  actionBookmark: { marginLeft: 12 },
  bookmarkText: { color: '#8E79B3', fontWeight: '800' },
  bookmarkTextActive: { color: '#D4A017' },

  // lavender card used in grid (matching dashboard quick actions)
  lavenderCard: {
    borderRadius: 14,
    overflow: 'hidden',
    justifyContent: 'center',
    // subtle border and shadow to match dashboard
    borderWidth: 1,
    borderColor: 'rgba(124, 95, 255, 0.08)',
    shadowColor: '#6B4EFF',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 6,
    // slightly translucent so content looks integrated with gradient
    backgroundColor: 'transparent',
  },
  // removed cardInner: inner white box is intentionally removed
  leftCol: { flex: 1, paddingRight: 8 },
  rightCol: { alignItems: 'flex-end', justifyContent: 'center' },

  cardSubtitle: { fontSize: 12, color: '#6F5AA7', marginTop: 6 },

  footer: { padding: 12, borderTopWidth: 1, borderTopColor: '#F0E9FF', alignItems: 'center' },
  footerText: { color: '#8570A8' },
});

// List styles (for cards/grid)
const listStyles = StyleSheet.create({
  card: {
    padding: 0, // content padding handled inside the card wrapper layout above
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0E9FF',
  },
  courseEmoji: { fontSize: 26, marginLeft: 8 },
  pctBadge: { fontSize: 12, fontWeight: '900', color: '#37284A' },

  cardTitleSmall: { fontSize: 15, fontWeight: '900', color: '#2D2347' },
  cardSubSmall: { fontSize: 12, color: '#8570A8', marginTop: 6 },

  // PROGRESS BAR (outside the card)
  progressWrap: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  progressTrack: {
    flex: 1,
    height: 10,
    backgroundColor: '#F3EEF9', // subtle lavender track
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 10,
  },
  progressFill: {
    height: 10,
    borderRadius: 10,
    width: '0%',
  },
  progressLabel: {
    fontSize: 12,
    color: '#4B3863',
    fontWeight: '700',
    minWidth: 36,
    textAlign: 'right',
  },
});

export { ROADMAPS };
