import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '**', // Matches any hostname
        port: '',
        pathname: '**', // Matches any path
      },
      {
        protocol: 'https',
        hostname: '**', // Matches any hostname
        port: '',
        pathname: '**', // Matches any path
      },
    ],
  },
};


export default nextConfig;
