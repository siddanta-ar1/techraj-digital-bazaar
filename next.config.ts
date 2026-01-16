import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      // 1. Allow your specific Supabase Storage domain
      {
        protocol: "https",
        hostname: "**.supabase.co", // Covers your specific project ID
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
      // 2. Allow Google Auth Avatars (if you use Google Login)
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "**",
      },
      // 3. Allow GitHub Auth Avatars (if you use GitHub Login)
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        port: "",
        pathname: "**",
      },
      // 4. (Optional) Allow UI Avatars if you use them for defaults
      {
        protocol: "https",
        hostname: "ui-avatars.com",
        port: "",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "**",
      },
    ],
  },
};

export default nextConfig;
