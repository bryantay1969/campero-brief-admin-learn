import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // API routes need a real Next server (not static `output: "export"`).
  // Local: npm run dev / npm run build && npm start
  // Host: Netlify/Vercel with Next runtime + env vars
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
