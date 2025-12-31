import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 画像最適化の設定（アフィリエイト商品画像用）
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "m.media-amazon.com",
      },
      {
        protocol: "https",
        hostname: "images-na.ssl-images-amazon.com",
      },
      {
        protocol: "https",
        hostname: "thumbnail.image.rakuten.co.jp",
      },
    ],
  },
};

export default nextConfig;
