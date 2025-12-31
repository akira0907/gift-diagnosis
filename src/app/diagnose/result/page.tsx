import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ResultContent } from "./ResultContent";

export const metadata: Metadata = {
  title: "診断結果",
  description: "あなたにぴったりのギフトが見つかりました",
};

export default function ResultPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* ヘッダー */}
      <header className="border-b border-secondary-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-lg font-bold text-primary-600">
            ギフト診断
          </Link>
          <Link
            href="/diagnose"
            className="text-sm text-primary-600 hover:underline"
          >
            もう一度診断する
          </Link>
        </div>
      </header>

      <Suspense
        fallback={
          <div className="flex min-h-[50vh] items-center justify-center">
            <div className="text-center">
              <div className="mb-4 text-4xl">🎁</div>
              <p className="text-secondary-600">結果を読み込み中...</p>
            </div>
          </div>
        }
      >
        <ResultContent />
      </Suspense>
    </main>
  );
}
