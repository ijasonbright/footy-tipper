/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@neondatabase/serverless']
  },
  images: {
    domains: ['img.clerk.com'],
  },
}

module.exports = nextConfig
