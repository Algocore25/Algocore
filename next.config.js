/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['@ffmpeg-installer/ffmpeg', 'fluent-ffmpeg'],
  },
};

module.exports = nextConfig;
