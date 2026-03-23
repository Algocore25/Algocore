/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // temporarily disabled to prevent double rendering during migration
  output: 'standalone',   // produces a self-contained build for Azure App Service
};

export default nextConfig;
