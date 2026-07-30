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
};

export default nextConfig;
