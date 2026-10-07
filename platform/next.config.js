// Baseline security headers, safe for any hosting setup. Deliberately not
// here: HSTS (depends on the production HTTPS/proxy setup, unknown so far)
// and a full Content-Security-Policy (needs its own audit — Next.js inline
// scripts, reCAPTCHA, user-supplied image URLs). The CSP below only forbids
// framing; it does not restrict scripts, styles or images.
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  // The 14-day program is not part of the V1 Reset lineup (1/3/7/28 days).
  // Temporary (307), not permanent, so old links land on the programs
  // overview without browsers caching the move forever.
  async redirects() {
    return [{ source: '/practices/programs/14-days', destination: '/practices/programs', permanent: false }];
  },
};

module.exports = nextConfig;
