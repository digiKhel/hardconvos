import type { NextConfig } from "next";

const config: NextConfig = {
  // The badge covers our controls at phone width. Errors still show without it.
  devIndicators: false,
};

export default config;
