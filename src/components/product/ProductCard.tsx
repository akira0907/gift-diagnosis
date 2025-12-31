"use client";

import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  rank?: number;
  onAffiliateClick?: (product: Product, provider: string) => void;
}

export function ProductCard({
  product,
  rank,
  onAffiliateClick,
}: ProductCardProps) {
  const primaryLink = product.affiliateLinks[0];

  const handleClick = () => {
    if (onAffiliateClick && primaryLink) {
      onAffiliateClick(product, primaryLink.provider);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-secondary-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* 商品画像 */}
      <div className="relative aspect-square bg-secondary-100">
        {rank && (
          <div className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-sm font-bold text-white">
            {rank}
          </div>
        )}
        {/* 画像がない場合のプレースホルダー */}
        <div className="flex h-full items-center justify-center text-6xl text-secondary-300">
          🎁
        </div>
      </div>

      {/* 商品情報 */}
      <div className="p-4">
        <div className="mb-1 text-xs text-secondary-500">{product.category}</div>
        <h3 className="mb-2 line-clamp-2 text-lg font-bold text-secondary-900">
          {product.name}
        </h3>
        <p className="mb-3 line-clamp-2 text-sm text-secondary-600">
          {product.description}
        </p>

        {/* 価格 */}
        <div className="mb-4 text-xl font-bold text-primary-600">
          ¥{product.price.toLocaleString()}
          <span className="ml-1 text-xs font-normal text-secondary-500">
            (税込)
          </span>
        </div>

        {/* 購入ボタン */}
        {primaryLink && (
          <a
            href={primaryLink.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            className="block w-full rounded-lg bg-primary-600 py-3 text-center font-bold text-white transition-colors hover:bg-primary-700"
          >
            {primaryLink.provider === "amazon" && "Amazonで見る"}
            {primaryLink.provider === "rakuten" && "楽天で見る"}
            {primaryLink.provider === "yahoo" && "Yahoo!で見る"}
          </a>
        )}

        {/* 複数リンクがある場合 */}
        {product.affiliateLinks.length > 1 && (
          <div className="mt-2 flex gap-2">
            {product.affiliateLinks.slice(1).map((link) => (
              <a
                key={link.provider}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onAffiliateClick?.(product, link.provider)}
                className="flex-1 rounded-lg border border-secondary-300 py-2 text-center text-sm text-secondary-700 transition-colors hover:bg-secondary-50"
              >
                {link.provider === "amazon" && "Amazon"}
                {link.provider === "rakuten" && "楽天"}
                {link.provider === "yahoo" && "Yahoo!"}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
