/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [],
  },
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium-min"],
}

module.exports = nextConfig
