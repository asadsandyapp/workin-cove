import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Keep Turbopack rooted on this app (avoids picking up ~/package-lock.json)
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
