const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure Metro looks for modules in this directory
config.projectRoot = __dirname;
config.watchFolders = [__dirname];

module.exports = config; 