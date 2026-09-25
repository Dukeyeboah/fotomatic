import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep firebase-admin / stripe out of the Turbopack server bundle.
  // Bundling them pulls jose (ESM) through jwks-rsa (CJS) and crashes route
  // module load with ERR_REQUIRE_ESM → HTML 500 (x-matched-path: /500).
  serverExternalPackages: [
    "firebase-admin",
    "stripe",
    "@google-cloud/firestore",
    "jose",
    "jwks-rsa",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/v0/b/**",
      },
    ],
  },
  async redirects() {
    return [
      { source: "/dashboard", destination: "/photographers", permanent: false },
      {
        source: "/dashboard/photographers",
        destination: "/photographers",
        permanent: false,
      },
      {
        source: "/dashboard/bookings/payment/:path*",
        destination: "/bookings/payment/:path*",
        permanent: false,
      },
      {
        source: "/dashboard/bookings",
        destination: "/bookings",
        permanent: false,
      },
      {
        source: "/dashboard/messages",
        destination: "/messages",
        permanent: false,
      },
      { source: "/dashboard/saved", destination: "/saved", permanent: false },
      {
        source: "/dashboard/payments",
        destination: "/payments",
        permanent: false,
      },
      {
        source: "/dashboard/settings",
        destination: "/settings",
        permanent: false,
      },
      {
        source: "/dashboard/profile",
        destination: "/profile",
        permanent: false,
      },
      {
        source: "/dashboard/notifications",
        destination: "/notifications",
        permanent: false,
      },
      {
        source: "/dashboard/contact",
        destination: "/contact",
        permanent: false,
      },
      { source: "/orders", destination: "/bookings", permanent: false },
      {
        source: "/photographer/requests",
        destination: "/photographer/bookings",
        permanent: false,
      },
    ];
  },
  /**
   * Proxy Firebase Auth handler so Google “Continue to …” shows fotomatic.app
   * instead of fotomatic-40799.firebaseapp.com. Requires:
   * - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=www.fotomatic.app (or fotomatic.app)
   * - Authorized domain in Firebase Auth console
   * - OAuth redirect URI https://www.fotomatic.app/__/auth/handler in Google Cloud
   */
  async rewrites() {
    return [
      {
        source: "/__/auth/:path*",
        destination:
          "https://fotomatic-40799.firebaseapp.com/__/auth/:path*",
      },
    ];
  },
};

export default nextConfig;
