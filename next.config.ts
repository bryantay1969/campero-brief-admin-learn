import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static HTML export → `out/` folder for Netlify drag-and-drop (or publish: out)
  output: "export",
  // Recommended for static hosting of Next assets
  images: {
    unoptimized: true,
  },
  // Trailing slashes help static hosts resolve nested paths cleanly
  trailingSlash: true,
};

export default nextConfig;
