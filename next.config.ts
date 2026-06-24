import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
      // Temporarily whitelist Unsplash for our mock seed data
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim())
        : ["localhost:3000", "*.ngrok-free.app"]
    }
  }
};

export default nextConfig;
