export const getBotReply = (input, context = null) => {
  const text = input.toLowerCase();

  // 🔹 Step 1: Check contextual flow
  if (context === "career") {
    if (text.includes("ai")) {
      return {
        reply:
          "🧠 AI/ML Path:\n1️⃣ Learn Python\n2️⃣ Math for ML\n3️⃣ Study Algorithms\n4️⃣ Build Projects\n5️⃣ Learn Deep Learning 🚀",
        context: null,
      };
    } else if (text.includes("web")) {
      return {
        reply:
          "🌐 Web Dev Path:\n→ HTML, CSS, JS\n→ React.js\n→ Node.js / Express\n→ Build 3+ Projects 💻",
        context: null,
      };
    } else if (text.includes("app")) {
      return {
        reply:
          "📱 App Dev Path:\n→ Learn React Native or Flutter\n→ Practice small UI apps\n→ Integrate APIs\n→ Publish on Play Store!",
        context: null,
      };
    }
  }

  // 🔹 Step 2: General responses
  if (text.includes("hello") || text.includes("hi")) {
    return { reply: "👋 Hey there! How can I assist you today?", context: null };
  }

  if (text.includes("career") || text.includes("guidance")) {
    return {
      reply:
        "🎯 Career guidance is my thing! Which field interests you most?\n👉 AI/ML\n👉 Web Dev\n👉 App Dev",
      context: "career",
    };
  }

  if (text.includes("bye") || text.includes("thank")) {
    return {
      reply: "😊 You’re always welcome! Keep learning and growing with E-Hub!",
      context: null,
    };
  }

  // 🔹 Default fallback
  return {
    reply: "🤔 I’m still learning! Could you be more specific?",
    context: null,
  };
};
