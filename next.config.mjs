/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  distDir: process.env.BABYLON_DEV === "1" ? ".next-dev" : ".next",
  transpilePackages: ["three"],
};

export default nextConfig;
