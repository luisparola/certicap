/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['puppeteer', '@sparticuz/chromium'],
  },
  images: {
    remotePatterns: [],
  },
}

module.exports = nextConfig
