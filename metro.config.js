const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);

// Explicitly ensure TypeScript and JavaScript extensions are registered
config.resolver.sourceExts = [...new Set([...config.resolver.sourceExts, 'ts', 'tsx', 'js', 'jsx', 'json', 'sql'])];

module.exports = config;
