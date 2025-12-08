// src/screens/ChatScreenMarkdownGreetings.js
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
  Animated,
  RefreshControl,
  Image,
  Keyboard,
  StatusBar,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import Markdown from "react-native-markdown-display";
import { LinearGradient } from "expo-linear-gradient";

// ------------------ CONFIG ------------------
// NOTE: If you're testing on Expo on a physical device, set BASE_URL to your PC LAN IP like:
// const BASE_URL = "http://192.168.1.47:5000/chat";
const BASE_URL = "https://ehub-backend-itr3.onrender.com""; 

// Local image: adjust path as necessary. Assuming project structure: /e-hub/assets/Logo.jpg and this file is in src/screens
// If your logo sits elsewhere, change the path.
const UPLOADED_IMAGE = require("../../assets/Logo.jpg");

// ------------------ HELPERS ------------------
const nowTime = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};
const safeText = (v) => {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  try {
    return String(v);
  } catch {
    return JSON.stringify(v);
  }
};
const preprocessMarkdown = (raw) => {
  let t = safeText(raw);
  t = t.replace(/<br\s*\/?>/gi, "\n");
  t = t.replace(/\r\n/g, "\n");
  t = t.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
  return t;
};

// make data URI from base64 if server sends raw base64 without header
const base64ToDataUri = (b64, mime = "image/png") => {
  if (!b64) return "";
  // if it already looks like a data URI, return as-is
  if (b64.startsWith("data:")) return b64;
  return `data:${mime};base64,${b64}`;
};

// ------------------ CUSTOM MARKDOWN RULES ------------------
// Image rule: keep safe fallback to local image
const rules = {
  image: (node) => {
    const src = node.attributes?.src ?? "";
    let uri = String(src || "");
    if (!uri) uri = "";
    if (!uri.startsWith("http://") && !uri.startsWith("https://") && !uri.startsWith("file://") && !uri.startsWith("data:")) {
      uri = "";
    }
    if (uri) {
      return <Image source={{ uri }} style={{ width: "100%", height: 180, borderRadius: 8, marginTop: 8 }} />;
    }
    // fallback local
    return <Image source={UPLOADED_IMAGE} style={{ width: "100%", height: 180, borderRadius: 8, marginTop: 8 }} />;
  },

  // fence -> render code blocks in a horizontal ScrollView using monospace
  fence: (node, children, parent, styles) => {
    const content = node.content ?? "";
    const mono = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });
    return (
      <ScrollView
        key={Math.random().toString(36).slice(2)}
        horizontal
        showsHorizontalScrollIndicator
        style={{ marginTop: 8, marginBottom: 8 }}
      >
        <View style={{ minWidth: "100%", paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, backgroundColor: "#0F1724" }}>
          <Text selectable style={{ fontFamily: mono, color: "#E6EEF8", fontSize: 13, lineHeight: 18 }}>
            {content}
          </Text>
        </View>
      </ScrollView>
    );
  },
};

// markdown styles (generic)
const mdStyles = {
  body: { color: "#2D2347", fontSize: 16, lineHeight: 22, fontWeight: "600" },
  heading1: { fontSize: 20, marginBottom: 6, fontWeight: "700", color: "#35264A" },
  heading2: { fontSize: 18, marginBottom: 6, fontWeight: "700", color: "#35264A" },
  code_inline: { backgroundColor: "#F1EBFF", paddingHorizontal: 6, borderRadius: 6, color: "#342455" },
  table: { borderWidth: 1, borderColor: "#F0E9FF" },
};

// quick replies
const GREETING_TITLE = "Welcome to E-Hub Chat";
const GREETING_SUB = "Ask anything — roadmap, study plan, resources or practice problems.";
const QUICK_REPLIES = [
  { id: "r1", label: "Show AI roadmap", text: "Show me an AI learning roadmap" },
  { id: "r2", label: "Study plan (3 months)", text: "Give me a 3-month AI study plan" },
  { id: "r3", label: "Resources", text: "Share resources for deep learning" },
  { id: "r4", label: "Practice problem", text: "Give me a beginner ML practice problem" },
];

// ---------- BotMessage: animated container for each bot message ----------
function BotMessage({ text, time }) {
  const anim = useRef(new Animated.Value(0)).current; // 0 -> hidden; 1 -> visible

  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 360, useNativeDriver: true }).start();
  }, [anim]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] });
  const opacity = anim;

  return (
    <Animated.View style={[styles.rowBot, { opacity, transform: [{ translateY }] }]}>
      <View style={styles.botBubbleFull}>
        <Markdown rules={rules} style={mdStyles}>
          {preprocessMarkdown(text)}
        </Markdown>
        <View style={styles.metaRowFull}>
          <Text style={styles.msgTime}>{safeText(time)}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

// ---------- UserMessage: animated container for each user message (to match bot) ----------
function UserMessage({ text, time, status }) {
  const anim = useRef(new Animated.Value(0)).current; // 0 -> hidden; 1 -> visible

  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 360, useNativeDriver: true }).start();
  }, [anim]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] });
  const opacity = anim;

  return (
    <Animated.View style={[styles.rowUser, { opacity, transform: [{ translateY }] }]}>
      <View style={styles.spacer} />
      <View style={styles.userBubble}>
        <Text style={styles.userMsgText}>{safeText(text)}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.msgTime}>{safeText(time)}</Text>
          <Text style={styles.msgStatus}>
            {status === "read" ? "✓✓" : status === "delivered" ? "✓" : ""}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

// ---------- TypingDots: animated typing indicator (3 pulsing dots) ----------
function TypingDots() {
  const a1 = useRef(new Animated.Value(0)).current;
  const a2 = useRef(new Animated.Value(0)).current;
  const a3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDot = (anim, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 420, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.3, duration: 420, useNativeDriver: true }),
        ])
      );

    const l1 = animateDot(a1, 0);
    const l2 = animateDot(a2, 160);
    const l3 = animateDot(a3, 320);
    l1.start();
    l2.start();
    l3.start();

    return () => {
      l1.stop();
      l2.stop();
      l3.stop();
    };
  }, [a1, a2, a3]);

  const dotStyle = (anim) => ({
    width: 8,
    height: 8,
    borderRadius: 8,
    marginLeft: 6,
    backgroundColor: "#6B4EFF",
    transform: [{ scale: anim.interpolate({ inputRange: [0.3, 1], outputRange: [0.8, 1.25] }) }],
    opacity: anim.interpolate({ inputRange: [0.3, 1], outputRange: [0.5, 1] }),
  });

  return (
    <View style={styles.typingDotsRow}>
      <Animated.View style={dotStyle(a1)} />
      <Animated.View style={dotStyle(a2)} />
      <Animated.View style={dotStyle(a3)} />
    </View>
  );
}

// ---------- Main screen ----------
export default function ChatScreenMarkdownGreetings() {
  const [messages, setMessages] = useState([]); // messages in chronological order (oldest -> newest)
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showGreeting, setShowGreeting] = useState(true);
  const [recording, setRecording] = useState(false);

  const fade = useRef(new Animated.Value(1)).current;
  const flatRef = useRef(null);
  const inputTranslate = useRef(new Animated.Value(0)).current;
  const kbShowRef = useRef(null);
  const kbHideRef = useRef(null);
  const idCounter = useRef(1);

  const genId = (prefix = "m") => `${prefix}_${Date.now()}_${idCounter.current++}`;

  // diagnostic duplicate-id check
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    const seen = new Map();
    const duplicates = [];
    messages.forEach((m) => {
      const id = safeText(m?.id);
      if (!id) {
        duplicates.push({ type: "missing-id", msg: m });
      } else {
        if (seen.has(id)) duplicates.push({ type: "duplicate-id", id, msg: m });
        seen.set(id, true);
      }
    });
    if (duplicates.length > 0) {
      console.warn("ChatScreen: message id issues detected:", duplicates);
    }
  }, [messages]);

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }, [fade]);

  // NOTE: we intentionally DO NOT auto-scroll when new messages arrive.
  // The FlatList will keep its scroll position so that the bot reply doesn't force a jump.

  useEffect(() => {
    const offset = Platform.OS === "ios" ? 0 : 20;
    // Keep keyboard listeners for the input translation only.
    // DO NOT call scrollToEnd/scrollToOffset on keyboard show — avoids automatic scroll.
    kbShowRef.current = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        const height = e.endCoordinates?.height ?? 300;
        const toValue = -(height - offset - 36);
        Animated.timing(inputTranslate, { toValue, duration: 180, useNativeDriver: true }).start();
      }
    );
    kbHideRef.current = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        Animated.timing(inputTranslate, { toValue: 0, duration: 160, useNativeDriver: true }).start();
      }
    );
    return () => {
      kbShowRef.current?.remove();
      kbHideRef.current?.remove();
    };
  }, [inputTranslate]);

  const onPickImage = () => console.log("Pick image - implement picker");
  const onPickDocument = () => console.log("Pick document - implement picker");
  const toggleRecording = () => setRecording((r) => !r);

  /**
   * sendText: sends the user prompt to backend and handles:
   *  - text-only reply (res.data.reply / res.data.message)
   *  - imageUrl (res.data.imageUrl)
   *  - images array (res.data.images)
   *  - base64 image (res.data.imageBase64)
   *
   * When an image is present we convert it into markdown image syntax so the Markdown renderer will display it.
   *
   * Backend contract (recommended):
   *  - { reply: "text", imageUrl: "https://...", images: ["..."], imageBase64: "..." }
   */
  const sendText = async (text) => {
    const txt = (text || "").trim();
    if (!txt) return;
    setShowGreeting(false);

    const id = genId("u");
    const userMsg = { id, text: txt, sender: "user", time: nowTime(), status: "sending" };

    // APPEND user message (normal chat order: user -> bot below it)
    setMessages((p) => [...p, userMsg]);

    setTimeout(() => setMessages((p) => p.map((m) => (m.id === id ? { ...m, status: "delivered" } : m))), 300);
    setTimeout(() => setMessages((p) => p.map((m) => (m.id === id ? { ...m, status: "read" } : m))), 1000);

    try {
      setIsTyping(true);
      const res = await axios.post(BASE_URL, { message: txt }, { timeout: 20000 }); // longer timeout for image gen
      const data = res?.data ?? {};

      // prefer explicit text fields
      let replyText = data?.reply ?? data?.message ?? "";
      let markdownParts = [];

      // If backend returned images array (URLs)
      if (Array.isArray(data?.images) && data.images.length > 0) {
        // turn URLs into markdown image tags
        data.images.forEach((u) => {
          if (u) markdownParts.push(`![](${u})`);
        });
      }

      // single image URL
      if (data?.imageUrl) {
        markdownParts.push(`![](${data.imageUrl})`);
      }

      // base64 image (raw string from server)
      if (data?.imageBase64) {
        // try to guess mime type if provided
        const mime = data?.imageMime ?? "image/png";
        const uri = base64ToDataUri(data.imageBase64, mime);
        markdownParts.push(`![](${uri})`);
      }

      // If the replyText itself contains an image markdown or URL, leave as-is.
      // Combine text reply and generated images: text first, then image markdowns.
      let finalBotContent = "";
      if (replyText) finalBotContent += `${replyText}\n\n`;
      if (markdownParts.length > 0) finalBotContent += markdownParts.join("\n\n");

      // fallback: if empty, try to stringify the entire response
      if (!finalBotContent.trim()) {
        finalBotContent = safeText(data) || "No response";
      }

      const delay = 500 + Math.min(900, txt.length * 12);
      setTimeout(() => {
        const botId = genId("b");
        const botMsg = { id: botId, text: finalBotContent, sender: "bot", time: nowTime() };
        // APPEND bot reply so it appears below the user message
        setMessages((p) => [...p, botMsg]);
        setIsTyping(false);
      }, delay);
    } catch (err) {
      console.warn("ChatScreen: sendText axios error:", err && err.message ? err.message : err);
      setIsTyping(false);
      const errId = genId("b_err");
      setMessages((p) => [...p, { id: errId, text: "⚠️ Unable to reach server.", sender: "bot", time: nowTime() }]);
    }
  };

  const sendMessage = () => {
    if (!String(input || "").trim()) return;
    sendText(input);
    setInput("");
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setMessages([]);
      setRefreshing(false);
      setShowGreeting(true);
    }, 600);
  }, []);

  // ensure id safety
  const ensureId = (msg, prefix = "m") => {
    if (!msg) return { id: genId(prefix) };
    if (!msg.id) return { ...msg, id: genId(prefix) };
    return msg;
  };

  // ---------- RENDER ITEM: bot left full-width (animated), user right (animated) ----------
  const renderItem = ({ item }) => {
    const safeItem = ensureId(item);
    const isUser = String(safeItem.sender) === "user";

    if (isUser) {
      return <UserMessage key={safeItem.id} text={safeItem.text} time={safeItem.time} status={safeItem.status} />;
    }

    // Bot message (animated component)
    return <BotMessage key={safeItem.id} text={safeItem.text} time={safeItem.time} />;
  };

  const keyExtractor = (item, idx) => {
    if (!item) return `missing_item_${idx}`;
    if (item.id) return String(item.id);
    return genId(`fallback_${idx}`);
  };

  const GreetingCard = () => (
    <Animated.View style={[styles.greetingCard, { opacity: fade }]}>
      <View style={styles.greetingLeft}>
        <LinearGradient colors={["#6B4EFF", "#8E79B3"]} style={styles.greetingIcon}>
          <Ionicons name="sparkles" size={20} color="#fff" />
        </LinearGradient>
      </View>
      <View style={styles.greetingBody}>
        <Text style={styles.greetingTitle}>{GREETING_TITLE}</Text>
        <Text style={styles.greetingSub}>{GREETING_SUB}</Text>
        <Image source={UPLOADED_IMAGE} style={styles.greetingImage} resizeMode="cover" />
        <View style={styles.chipsRow}>
          {QUICK_REPLIES.map((r) => (
            <TouchableOpacity key={r.id} style={styles.chip} activeOpacity={0.86} onPress={() => sendText(r.text)}>
              <Text style={styles.chipText}>{r.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.greetingActions}>
          <TouchableOpacity onPress={() => setShowGreeting(false)}>
            <Text style={styles.dismissText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F5FF" />
      <View style={{ flex: 1 }}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image source={UPLOADED_IMAGE} style={styles.headerLogo} />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.headerTitle}>E-Hub Assistant</Text>
              <Text style={styles.headerSub}>your AI</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.headerRight}>
            <Ionicons name="notifications-outline" size={22} color="#6B4EFF" />
          </TouchableOpacity>
        </View>

        {showGreeting && <GreetingCard />}

        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={[styles.chatContent, showGreeting ? { paddingTop: 8 } : {}, { paddingBottom: 82 + 8 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6B4EFF" />}
          keyboardShouldPersistTaps="handled"
          // intentionally NOT auto-scrolling when new messages are added
        />

        {isTyping && (
          <View style={styles.typingRow}>
            <View style={styles.typingBubble}>
              <TypingDots />
            </View>
          </View>
        )}

        <Animated.View style={[styles.inputWrap, { transform: [{ translateY: inputTranslate }] }]}>
          <View style={styles.singleBar}>
            <View style={styles.barLeft}>
              <TouchableOpacity onPress={onPickImage} activeOpacity={0.8} style={styles.barIcon}>
                <Ionicons name="image-outline" size={18} color="#6B4EFF" />
              </TouchableOpacity>

              <TouchableOpacity onPress={onPickDocument} activeOpacity={0.8} style={styles.barIcon}>
                <Ionicons name="document-outline" size={18} color="#6B4EFF" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.singleInput}
              placeholder="Type a message..."
              placeholderTextColor="#8D7FB8"
              value={input}
              onChangeText={setInput}
              multiline
              returnKeyType="send"
              onSubmitEditing={sendMessage}
              underlineColorAndroid="transparent"
            />

            {!String(input || "").trim() ? (
              <TouchableOpacity style={styles.barAction} onPress={toggleRecording} activeOpacity={0.8}>
                <Ionicons name={recording ? "stop" : "mic-outline"} size={20} color={recording ? "#fff" : "#6B4EFF"} />
                {recording && <View style={styles.recordDot} />}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.barAction, styles.sendAction]}
                onPress={() => {
                  sendText(input);
                  setInput("");
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="send" size={18} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F5FF" },
  header: {
    height: 72,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE6FF",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  headerLogo: { width: 44, height: 44, borderRadius: 10, borderWidth: 1, borderColor: "#EEE6FF", backgroundColor: "#fff" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#35264A" },
  headerSub: { fontSize: 12, color: "#8E79B3" },
  headerRight: { padding: 6 },

  // Greeting
  greetingCard: {
    margin: 16,
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F0E9FF",
    flexDirection: "row",
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  greetingLeft: { marginRight: 12 },
  greetingIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  greetingBody: { flex: 1 },
  greetingTitle: { fontSize: 16, fontWeight: "700", color: "#35264A" },
  greetingSub: { fontSize: 14, color: "#6E5A8A", marginTop: 6 },
  greetingImage: { width: "100%", height: 140, borderRadius: 8, marginTop: 10 },

  chipsRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 10 },
  chip: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ECE7FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: { color: "#35264A", fontWeight: "700" },
  greetingActions: { marginTop: 8, alignItems: "flex-start" },
  dismissText: { color: "#8E79B3" },

  chatContent: { paddingTop: 12, paddingHorizontal: 16 },

  // Bot: full-width row & bubble (CHATGPT style)
  rowBot: { width: "100%", marginBottom: 12 },
  botBubbleFull: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#F0E9FF",
    // ChatGPT-like subtle shadow
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 6,
    elevation: 0,
  },

  // User row & bubble (right side) — rounded like ChatGPT
  rowUser: { flexDirection: "row", alignItems: "flex-end", justifyContent: "flex-end", marginBottom: 12 },
  userBubble: {
    backgroundColor: "#6B4EFF",
    // slightly asymmetric corners to hint a "tail"
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    maxWidth: "78%",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  userMsgText: { color: "#fff", fontSize: 16, fontWeight: "600", lineHeight: 22 },

  // metadata
  metaRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 8 },
  msgTime: { fontSize: 11, color: "#A79AD0" },
  msgStatus: { fontSize: 12, color: "#34D399", marginLeft: 8 },

  // full-width meta for bot (right-aligned timestamp inside bubble)
  metaRowFull: { marginTop: 8, alignItems: "flex-end", justifyContent: "flex-end", flexDirection: "row" },

  spacer: { width: 44 },

  // typing indicator (no avatar) — bubble containing animated dots
  typingRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, marginBottom: 8 },
  typingBubble: { marginLeft: 0, backgroundColor: "#F1EBFF", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, alignSelf: "flex-start", marginLeft: 4 },
  typingDotsRow: { flexDirection: "row", alignItems: "center" },

  // input
  inputWrap: { flexDirection: "row", alignItems: "center", padding: 12, borderTopWidth: 1, borderTopColor: "#F0E9FF", backgroundColor: "transparent" },
  singleBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F4FF",
    borderRadius: 28,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#ECE7FF",
  },
  barLeft: { flexDirection: "row", alignItems: "center", marginRight: 8 },
  barIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  singleInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 16,
    color: "#35264A",
  },
  barAction: {
    marginLeft: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  sendAction: { backgroundColor: "#6B4EFF" },
  recordDot: {
    position: "absolute",
    right: 8,
    top: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF4D4D",
  },
});
