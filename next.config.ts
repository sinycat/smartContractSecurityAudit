/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['mush-audit.vercel.app'],
    unoptimized: true,
  },
}

module.exports = nextConfig
