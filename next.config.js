/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
    logging: "verbose",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "http.cat",
      },
    ],
  },
};

module.exports = nextConfig;
