const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add resolver for Node.js polyfills
config.resolver.alias = {
  punycode: require.resolve('punycode/'),
  crypto: require.resolve('react-native-get-random-values'),
};

// Enable symlinks for better development experience
config.resolver.symlinks = false;

module.exports = config; 