import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ギフト診断 | あなたにぴったりのプレゼントを見つけよう",
    template: "%s | ギフト診断",
  },
  description:
    "贈る相手、シーン、予算を選ぶだけで、最適なギフトをAIが提案。もう迷わない、失敗しないプレゼント選び。",
  keywords: ["ギフト", "プレゼント", "診断", "おすすめ", "誕生日", "お祝い"],
  authors: [{ name: "ギフト診断" }],
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: "ギフト診断",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
