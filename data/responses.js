// components/botLogic.js

export const getBotReply = (input) => {
  const text = input.toLowerCase();

  if (text.includes("hello") || text.includes("hi")) {
    return "👋 Hello! I'm your E-Hub assistant. How can I help you today?";
  }

  if (text.includes("career") || text.includes("guidance")) {
    return "🎯 Career guidance is my specialty! Are you interested in AI/ML, Web Development, or App Development?";
  }

  if (text.includes("ai") || text.includes("machine learning")) {
    return "🤖 AI/ML Roadmap:\n1️⃣ Learn Python\n2️⃣ Math (Linear Algebra & Statistics)\n3️⃣ Study ML Algorithms\n4️⃣ Build Projects\n5️⃣ Learn Deep Learning frameworks (TensorFlow / PyTorch)";
  }

  if (text.includes("web")) {
    return "🌐 Web Development Path:\n→ Learn HTML, CSS, JS\n→ Move to React\n→ Explore backend (Node.js)\n→ Build real projects 🚀";
  }

  if (text.includes("app")) {
    return "📱 App Development:\n→ Start with React Native or Flutter\n→ Learn UI/UX basics\n→ Build small apps and publish on Play Store!";
  }

  if (text.includes("resume")) {
    return "📝 For a strong resume:\n- Highlight projects\n- Add GitHub links\n- Use clear formatting\n- Mention skills relevant to your field.";
  }

  if (text.includes("course")) {
    return "🎓 You can explore free courses on Coursera, NPTEL, or YouTube (CodeWithHarry, FreeCodeCamp, etc.). Want me to list some for your domain?";
  }

  if (text.includes("bye") || text.includes("thank")) {
    return "😊 You're always welcome! Keep learning and growing with E-Hub!";
  }

  return "🤔 I’m still learning! Could you be more specific?";
};
