import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@tiptap/react', '@tiptap/starter-kit', '@tiptap/extension-placeholder'],
  },
};

export default nextConfig;
