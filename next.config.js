/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  images: {
    domains: [],
  },
  // Force Vercel to rebuild
  generateBuildId: async () => {
    return `build-${Date.now()}`
  },
}

module.exports = nextConfig



