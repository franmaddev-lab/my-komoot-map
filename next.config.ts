import type { NextConfig } from "next";
import { execSync } from "child_process";

const sha = process.env.VERCEL_GIT_COMMIT_SHA
  ? process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7)
  : execSync("git rev-parse --short HEAD").toString().trim();

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_GIT_SHA: sha,
  },
};

export default nextConfig;
