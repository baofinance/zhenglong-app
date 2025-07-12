/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV || "production",
  },
  basePath: process.env.NEXT_PUBLIC_APP_ENV === "staging" ? "/staging" : "",
};

module.exports = nextConfig;
