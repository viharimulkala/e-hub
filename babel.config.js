// babel.config.js (root)
module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    // ...other plugins
    'react-native-reanimated/plugin' // <- MUST be last
  ],
};
