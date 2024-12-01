/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['mush-audit.vercel.app'],
    unoptimized: true,
  },
  async headers() {
    return [
      {
        // match all routes
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ]
      }
    ]
  },
  async rewrites() {
    return [
      {
        source: '/api/etherscan/:path*',
        destination: 'https://api.etherscan.io/api/:path*',
      },
      {
        source: '/api/bscscan/:path*',
        destination: 'https://api.bscscan.com/api/:path*',
      },
      {
        source: '/api/arbiscan/:path*',
        destination: 'https://api.arbiscan.io/api/:path*',
      },
      {
        source: '/api/basescan/:path*',
        destination: 'https://api.basescan.org/api/:path*',
      },
      {
        source: '/etherscan/:path*',
        destination: 'https://etherscan.io/:path*',
      },
      {
        source: '/bscscan/:path*',
        destination: 'https://bscscan.com/:path*',
      },
      {
        source: '/arbiscan/:path*',
        destination: 'https://arbiscan.io/:path*',
      },
      {
        source: '/basescan/:path*',
        destination: 'https://basescan.org/:path*',
      }
    ]
  },
}

module.exports = nextConfig
