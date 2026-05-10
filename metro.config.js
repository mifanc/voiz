const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const emptyShim = require.resolve('./shims/empty.js');

// extraNodeModules only catches CJS require(); resolveRequest catches all
// module lookups including ESM imports from .mjs files. The Anthropic SDK
// imports node:fs and node:path inside credential-file readers that are
// never called in React Native (we pass apiKey directly), so stubbing is safe.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('node:')) {
    return { filePath: emptyShim, type: 'sourceFile' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
