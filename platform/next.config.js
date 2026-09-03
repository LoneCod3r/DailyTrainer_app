/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Local/dev media foundation. Swap remotePatterns for your S3-compatible
    // storage domain once real media hosting is configured (see modules/media).
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
};

module.exports = nextConfig;
