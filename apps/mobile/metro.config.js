const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */

// Get the root directory of the monorepo
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = {
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resolver: {
    assetExts: require('@react-native/metro-config')
      .getDefaultConfig(__dirname)
      .resolver.assetExts.filter(ext => ext !== 'svg'),
    sourceExts: [
      ...require('@react-native/metro-config').getDefaultConfig(__dirname)
        .resolver.sourceExts,
      'svg',
    ],
    // Add monorepo node_modules to the search path
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(monorepoRoot, 'node_modules'),
    ],
    // Force React to resolve from local node_modules to avoid duplicates
    extraNodeModules: {
      'react-native': path.resolve(__dirname, 'node_modules/react-native'),
    },
  },
  // Watch for changes in the monorepo packages
  watchFolders: [monorepoRoot],
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
