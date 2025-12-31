import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* ヒーローセクション */}
      <section className="px-4 py-20 text-center">
        <h1 className="mb-6 text-4xl font-bold text-secondary-900 md:text-5xl">
          もう、プレゼント選びで
          <br />
          <span className="text-primary-600">迷わない。</span>
        </h1>
        <p className="mx-auto mb-10 max-w-xl text-lg text-secondary-600">
          贈る相手、シーン、予算を選ぶだけ。
          <br />
          あなたにぴったりのギフトを診断します。
        </p>
        <Link
          href="/diagnose"
          className="inline-block rounded-full bg-primary-600 px-10 py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-primary-700 hover:shadow-xl"
        >
          無料で診断スタート
        </Link>
      </section>

      {/* 特徴セクション */}
      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-2xl font-bold text-secondary-900">
            3つの質問に答えるだけ
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <FeatureCard
              step={1}
              title="誰に贈る？"
              description="彼氏、彼女、親、友人...相手を選ぶだけ"
            />
            <FeatureCard
              step={2}
              title="どんなシーン？"
              description="誕生日、記念日、お礼...シーンを選択"
            />
            <FeatureCard
              step={3}
              title="予算は？"
              description="3,000円〜30,000円で予算を設定"
            />
          </div>
        </div>
      </section>

      {/* CTAセクション */}
      <section className="bg-primary-600 px-4 py-16 text-center">
        <h2 className="mb-6 text-2xl font-bold text-white md:text-3xl">
          さっそく診断してみましょう
        </h2>
        <p className="mx-auto mb-8 max-w-lg text-primary-100">
          たった1分で、あなたの条件にぴったりのギフトが見つかります。
        </p>
        <Link
          href="/diagnose"
          className="inline-block rounded-full bg-white px-10 py-4 text-lg font-bold text-primary-600 shadow-lg transition-all hover:bg-primary-50 hover:shadow-xl"
        >
          診断をはじめる
        </Link>
      </section>

      {/* フッター */}
      <footer className="bg-secondary-900 px-4 py-8 text-center text-secondary-400">
        <p className="text-sm">© 2024 ギフト診断. All rights reserved.</p>
      </footer>
    </main>
  );
}

function FeatureCard({
  step,
  title,
  description,
}: {
  step: number;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl bg-primary-50 p-6 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 text-xl font-bold text-white">
        {step}
      </div>
      <h3 className="mb-2 text-lg font-bold text-secondary-900">{title}</h3>
      <p className="text-secondary-600">{description}</p>
    </div>
  );
}
