import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  // Remove output: 'export' and trailingSlash
};

export default nextConfig;