"use client";

import { useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/product/ProductCard";
import {
  matchProducts,
  getRelaxedMatches,
  generateSummary,
} from "@/lib/diagnose/engine";
import { getPublishedProducts } from "@/lib/products/loader";
import type { Product, DiagnoseFilters, Recipient, Occasion, BudgetRange } from "@/types";

export function ResultContent() {
  const searchParams = useSearchParams();
  const products = getPublishedProducts();

  const filters: DiagnoseFilters = {
    recipient: searchParams.get("recipient") as Recipient | undefined,
    occasion: searchParams.get("occasion") as Occasion | undefined,
    budgetRange: searchParams.get("budget") as BudgetRange | undefined,
  };

  const summary = generateSummary(filters);
  const matchedProducts = matchProducts(products, filters);

  // マッチが少ない場合は条件緩和して追加
  let relaxedProducts: Product[] = [];
  if (matchedProducts.length < 3) {
    relaxedProducts = getRelaxedMatches(
      products,
      filters,
      matchedProducts.map((p) => p.id),
      3 - matchedProducts.length
    );
  }

  const handleAffiliateClick = (product: Product, provider: string) => {
    // TODO: GA4イベント送信
    console.log("Affiliate click:", {
      product_id: product.id,
      product_name: product.name,
      provider,
      price: product.price,
    });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* 結果ヘッダー */}
      <div className="mb-8 text-center">
        <div className="mb-4 text-5xl">🎁</div>
        <h1 className="mb-2 text-2xl font-bold text-secondary-900">
          {summary}
        </h1>
        <p className="text-secondary-600">
          {matchedProducts.length > 0
            ? `${matchedProducts.length}件のおすすめが見つかりました`
            : "条件を緩和しておすすめを表示しています"}
        </p>
      </div>

      {/* 選択条件の表示 */}
      <div className="mb-8 flex flex-wrap justify-center gap-2">
        {filters.recipient && (
          <span className="rounded-full bg-primary-100 px-4 py-1 text-sm text-primary-700">
            {filters.recipient}へ
          </span>
        )}
        {filters.occasion && (
          <span className="rounded-full bg-primary-100 px-4 py-1 text-sm text-primary-700">
            {filters.occasion}
          </span>
        )}
        {filters.budgetRange && (
          <span className="rounded-full bg-primary-100 px-4 py-1 text-sm text-primary-700">
            {filters.budgetRange}
          </span>
        )}
      </div>

      {/* 商品リスト */}
      {matchedProducts.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {matchedProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              rank={index + 1}
              onAffiliateClick={handleAffiliateClick}
            />
          ))}
        </div>
      ) : relaxedProducts.length > 0 ? (
        <>
          <p className="mb-4 text-center text-secondary-600">
            ぴったりの商品が見つかりませんでした。
            <br />
            条件を緩和したおすすめをご紹介します。
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relaxedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAffiliateClick={handleAffiliateClick}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-2xl bg-secondary-100 p-8 text-center">
          <p className="mb-4 text-secondary-600">
            該当する商品が見つかりませんでした。
          </p>
          <a
            href="/diagnose"
            className="inline-block rounded-full bg-primary-600 px-6 py-3 font-bold text-white hover:bg-primary-700"
          >
            条件を変えて再診断
          </a>
        </div>
      )}

      {/* 追加のCTA */}
      {matchedProducts.length > 0 && (
        <div className="mt-12 rounded-2xl bg-secondary-900 p-8 text-center">
          <h2 className="mb-2 text-xl font-bold text-white">
            もっと探してみる？
          </h2>
          <p className="mb-4 text-secondary-300">
            条件を変えて、別のギフトも探してみましょう
          </p>
          <a
            href="/diagnose"
            className="inline-block rounded-full bg-white px-8 py-3 font-bold text-secondary-900 hover:bg-secondary-100"
          >
            もう一度診断する
          </a>
        </div>
      )}
    </div>
  );
}
