const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const sharedDir = path.resolve(__dirname, '..', 'shared');
const nodeModulesDir = path.resolve(__dirname, 'node_modules');

// Watch the shared directory outside the project root
config.watchFolders = [sharedDir];

// Resolve all node_modules from customer-app
config.resolver.nodeModulesPaths = [nodeModulesDir];

// Proxy to resolve any module from customer-app/node_modules
config.resolver.extraNodeModules = new Proxy(
  {},
  {
    get: (target, name) => {
      return path.join(nodeModulesDir, String(name));
    },
  }
);

// Force axios to resolve to browser build instead of Node.js build
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'axios') {
    return {
      filePath: path.resolve(nodeModulesDir, 'axios', 'dist', 'browser', 'axios.cjs'),
      type: 'sourceFile',
    };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
