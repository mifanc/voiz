const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// The Anthropic SDK imports node:fs and node:path only inside credential-file
// readers that are never invoked in React Native (we pass apiKey directly).
// Stub them out so Metro can bundle without error.
config.resolver.extraNodeModules = {
  'node:fs': require.resolve('./shims/empty.js'),
  'node:path': require.resolve('./shims/empty.js'),
};

module.exports = config;
