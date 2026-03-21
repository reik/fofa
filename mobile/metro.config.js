const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Block ESM builds that use import.meta (Metro uses CJS equivalents instead)
config.resolver.blockList = [
  // sucrase ESM build inside expo-asset uses import.meta.url
  /node_modules[/\\]expo-asset[/\\]node_modules[/\\]sucrase[/\\]dist[/\\]esm[/\\].*/,
  // Debugger frontend is DevTools code, not needed in the web bundle
  /node_modules[/\\]@react-native[/\\]debugger-frontend[/\\].*/,
];

module.exports = config;
