import type { NextConfig } from "next";

async function getNgrokUrl(): Promise<string | null> {
  try {
    const res = await fetch("http://127.0.0.1:4040/api/tunnels");
    if (res.ok) {
      const data = await res.json();
      const publicUrl = data.tunnels?.[0]?.public_url;
      if (publicUrl) {
        return publicUrl.replace(/^https?:\/\//, "");
      }
    }
  } catch (e) {
    // Ngrok is not running locally
  }
  return null;
}

const config = async (): Promise<NextConfig> => {
  const ngrokHost = await getNgrokUrl();
  const allowedOrigins = ["localhost:3000"];
  
  if (ngrokHost) {
    allowedOrigins.push(ngrokHost);
  }
  if (process.env.ALLOWED_ORIGINS) {
    allowedOrigins.push(...process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim()));
  }

  return {
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
        allowedOrigins
      }
    }
  };
};

export default config;
