/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed output: 'export' to allow dynamic routes for Firebase-based app
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  webpack: (config, { isServer }) => {
    config.cache = false;
    
    // Prevent Node.js modules from being bundled in client-side code
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        undici: false,
      };
      
      // Exclude problematic modules from client bundle
      config.externals = config.externals || [];
      config.externals.push({
        undici: 'undici',
        'node:crypto': 'crypto',
        'node:fs': 'fs',
        'node:path': 'path',
        'node:stream': 'stream',
        'node:url': 'url',
        'node:util': 'util',
      });
    }
    
    return config;
  },
};

module.exports = nextConfig;