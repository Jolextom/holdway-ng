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
      allowedOrigins: [
        "6aae-154-113-158-228.ngrok-free.app",
        "*.ngrok-free.app",
        "localhost:3000"
      ]
    }
  }
};

export default nextConfig;
