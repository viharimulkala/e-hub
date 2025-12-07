// src/screens/CoursesList.js
// Courses list — shows all domains with exact completed/total counts based on ROADMAPS.
// Tap a course to navigate to RoadmapJourneyMap and view that course.

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@ehub_journey_progress_v2';

// ---------- small helper ----------
const percent = (num, den) => (den === 0 ? 0 : Math.round((num / den) * 100));

// ---------- ROADMAPS (same copy as in RoadmapJourneyMap.js) ----------
const ROADMAPS = {
  'AI & ML': {
    title: 'AI · Machine Learning',
    levels: [
      { level: 'Beginner', steps: [{ id: 'ai_b1', label: 'Python for ML' }, { id: 'ai_b2', label: 'Linear Algebra' }, { id: 'ai_b3', label: 'Intro to ML' }] },
      { level: 'Intermediate', steps: [{ id: 'ai_i1', label: 'Deep Learning Basics' }, { id: 'ai_i2', label: 'Model Evaluation' }, { id: 'ai_i3', label: 'NLP Intro' }] },
      { level: 'Advanced', steps: [{ id: 'ai_a1', label: 'Production ML' }, { id: 'ai_a2', label: 'Research & Papers' }] },
    ],
  },

  'Web Development': {
    title: 'Web Development',
    levels: [
      { level: 'Beginner', steps: [{ id: 'web_b1', label: 'HTML & CSS' }, { id: 'web_b2', label: 'JavaScript Fundamentals' }] },
      { level: 'Intermediate', steps: [{ id: 'web_i1', label: 'React & Hooks' }, { id: 'web_i2', label: 'State Management' }] },
      { level: 'Advanced', steps: [{ id: 'web_a1', label: 'Performance & Security' }] },
    ],
  },

  'Cloud Engineering': {
    title: 'Cloud Engineering',
    levels: [
      { level: 'Beginner', steps: [{ id: 'cloud_b1', label: 'Cloud Concepts' }] },
      { level: 'Intermediate', steps: [{ id: 'cloud_i1', label: 'Docker & Containers' }, { id: 'cloud_i2', label: 'Infrastructure as Code' }] },
      { level: 'Advanced', steps: [{ id: 'cloud_a1', label: 'Kubernetes' }] },
    ],
  },

  'Cybersecurity': {
    title: 'Cybersecurity',
    levels: [
      { level: 'Beginner', steps: [{ id: 'sec_b1', label: 'Security Basics' }] },
      { level: 'Intermediate', steps: [{ id: 'sec_i1', label: 'Networking Fundamentals' }, { id: 'sec_i2', label: 'Web Security (OWASP)' }] },
      { level: 'Advanced', steps: [{ id: 'sec_a1', label: 'Pen-testing Basics' }] },
    ],
  },

  'Data Science': {
    title: 'Data Science',
    levels: [
      { level: 'Beginner', steps: [{ id: 'ds_b1', label: 'Pandas & EDA' }, { id: 'ds_b2', label: 'Statistics Basics' }] },
      { level: 'Intermediate', steps: [{ id: 'ds_i1', label: 'Feature Engineering' }, { id: 'ds_i2', label: 'Modeling' }] },
      { level: 'Advanced', steps: [{ id: 'ds_a1', label: 'Big Data & Spark' }] },
    ],
  },

  'Mobile Development': {
    title: 'Mobile Development',
    levels: [
      { level: 'Beginner', steps: [{ id: 'mob_b1', label: 'React Native Basics' }] },
      { level: 'Intermediate', steps: [{ id: 'mob_i1', label: 'Navigation & State' }] },
      { level: 'Advanced', steps: [{ id: 'mob_a1', label: 'Performance & CI' }] },
    ],
  },

  'DevOps': {
    title: 'DevOps',
    levels: [
      { level: 'Beginner', steps: [{ id: 'dev_b1', label: 'Git & CI Basics' }] },
      { level: 'Intermediate', steps: [{ id: 'dev_i1', label: 'CI/CD Pipelines' }, { id: 'dev_i2', label: 'Monitoring' }] },
      { level: 'Advanced', steps: [{ id: 'dev_a1', label: 'Auto-scaling & Observability' }] },
    ],
  },

  'UI/UX Design': {
    title: 'UI/UX Design',
    levels: [
      { level: 'Beginner', steps: [{ id: 'ux_b1', label: 'Design Principles' }] },
      { level: 'Intermediate', steps: [{ id: 'ux_i1', label: 'Prototyping (Figma)' }] },
      { level: 'Advanced', steps: [{ id: 'ux_a1', label: 'Design Systems' }] },
    ],
  },

  'Blockchain': {
    title: 'Blockchain',
    levels: [
      { level: 'Beginner', steps: [{ id: 'bc_b1', label: 'Crypto Basics' }] },
      { level: 'Intermediate', steps: [{ id: 'bc_i1', label: 'Smart Contracts' }] },
      { level: 'Advanced', steps: [{ id: 'bc_a1', label: 'Scaling & Security' }] },
    ],
  },

  'Computer Vision': {
    title: 'Computer Vision',
    levels: [
      { level: 'Beginner', steps: [{ id: 'cv_b1', label: 'Image Processing' }] },
      { level: 'Intermediate', steps: [{ id: 'cv_i1', label: 'CNNs & Transfer Learning' }] },
      { level: 'Advanced', steps: [{ id: 'cv_a1', label: 'Detection & Segmentation' }] },
    ],
  },

  'Natural Language Processing': {
    title: 'Natural Language Processing',
    levels: [
      { level: 'Beginner', steps: [{ id: 'nlp_b1', label: 'Text Preprocessing' }] },
      { level: 'Intermediate', steps: [{ id: 'nlp_i1', label: 'Sequence Models' }] },
      { level: 'Advanced', steps: [{ id: 'nlp_a1', label: 'Transformers & LLMs' }] },
    ],
  },

  'Robotics': {
    title: 'Robotics',
    levels: [
      { level: 'Beginner', steps: [{ id: 'rb_b1', label: 'Electronics Basics' }] },
      { level: 'Intermediate', steps: [{ id: 'rb_i1', label: 'Control Systems' }] },
      { level: 'Advanced', steps: [{ id: 'rb_a1', label: 'Autonomous Systems' }] },
    ],
  },

  // Programming languages
  'Python': {
    title: 'Python Programming',
    levels: [
      { level: 'Beginner', steps: [{ id: 'py_b1', label: 'Python Syntax & Basics' }, { id: 'py_b2', label: 'Data Types & Control Flow' }] },
      { level: 'Intermediate', steps: [{ id: 'py_i1', label: 'Modules & OOP' }, { id: 'py_i2', label: 'File I/O & Testing' }] },
      { level: 'Advanced', steps: [{ id: 'py_a1', label: 'Async & Performance' }, { id: 'py_a2', label: 'Packaging & Deployment' }] },
    ],
  },

  'Java': {
    title: 'Java Programming',
    levels: [
      { level: 'Beginner', steps: [{ id: 'java_b1', label: 'Java Basics & Syntax' }, { id: 'java_b2', label: 'OOP Concepts' }] },
      { level: 'Intermediate', steps: [{ id: 'java_i1', label: 'Collections & Generics' }, { id: 'java_i2', label: 'Concurrency Basics' }] },
      { level: 'Advanced', steps: [{ id: 'java_a1', label: 'JVM Tuning & Performance' }, { id: 'java_a2', label: 'Spring Framework Intro' }] },
    ],
  },

  'C++': {
    title: 'C++ Programming',
    levels: [
      { level: 'Beginner', steps: [{ id: 'cpp_b1', label: 'C++ Syntax & Basics' }, { id: 'cpp_b2', label: 'Pointers & Memory' }] },
      { level: 'Intermediate', steps: [{ id: 'cpp_i1', label: 'STL & Templates' }, { id: 'cpp_i2', label: 'Object-Oriented C++' }] },
      { level: 'Advanced', steps: [{ id: 'cpp_a1', label: 'Concurrency & Performance' }, { id: 'cpp_a2', label: 'Modern C++ (C++11+)' }] },
    ],
  },

  'C': {
    title: 'C Programming',
    levels: [
      { level: 'Beginner', steps: [{ id: 'c_b1', label: 'C Basics & Syntax' }, { id: 'c_b2', label: 'Variables, Loops & Conditions' }] },
      { level: 'Intermediate', steps: [{ id: 'c_i1', label: 'Pointers & Memory Management' }, { id: 'c_i2', label: 'Functions & Modular Programming' }] },
      { level: 'Advanced', steps: [{ id: 'c_a1', label: 'Structures & File Handling' }, { id: 'c_a2', label: 'Advanced Memory & Optimization' }] },
    ],
  },
};

// ---------- Helpers ----------
function totalStepsForDomain(domainObj) {
  return (domainObj.levels || []).reduce((acc, lvl) => acc + ((lvl.steps || []).length), 0);
}

function flattenSteps(domainObj) {
  return (domainObj.levels || []).flatMap((lvl) => (lvl.steps || []).map((s) => s.id));
}

// ---------- Component ----------
export default function CoursesList({ navigation }) {
  const [query, setQuery] = useState('');
  const [progress, setProgress] = useState({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!mounted) return;
        if (raw) setProgress(JSON.parse(raw));
      } catch (e) {
        console.warn('CoursesList: load progress failed', e);
      }
    })();
    return () => (mounted = false);
  }, []);

  const courses = useMemo(() => {
    return Object.keys(ROADMAPS).map((key) => {
      const domainObj = ROADMAPS[key];
      const total = totalStepsForDomain(domainObj);
      const stepIds = flattenSteps(domainObj);
      const completed = stepIds.filter((id) => progress[id]?.done).length;
      return { id: key, title: domainObj.title || key, total, completed, pct: percent(completed, total) };
    });
  }, [progress]);

  const filtered = useMemo(() => {
    if (!query) return courses;
    return courses.filter((c) => c.title.toLowerCase().includes(query.toLowerCase()));
  }, [query, courses]);

  function renderItem({ item }) {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate('RoadmapJourneyMap', { domain: item.id })}
        style={styles.card}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSub}>{item.completed}/{item.total} • {item.pct}%</Text>
          </View>
          <View style={styles.chev}>
            <Text style={{ color: '#6B4EFF', fontWeight: '800' }}>›</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>All Courses</Text>

      <TextInput
        placeholder="Search courses..."
        value={query}
        onChangeText={setQuery}
        style={styles.search}
        clearButtonMode="while-editing"
      />

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 12 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />
    </View>
  );
}

// styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FCFBFF' },
  header: { fontSize: 22, fontWeight: '900', padding: 16, color: '#2D2347' },
  search: {
    marginHorizontal: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F0E9FF',
    marginTop: 6,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0E9FF',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#2D2347' },
  cardSub: { fontSize: 12, color: '#8570A8', marginTop: 6 },
  chev: { marginLeft: 12 },
});
