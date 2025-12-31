/**
 * 商品データの読み込み
 * shared-data/products.json から商品を取得
 */

import type { Product, ProductsData } from "@/types";
import productsData from "@/data/products.json";

/**
 * 全商品を取得
 */
export function getAllProducts(): Product[] {
  const data = productsData as ProductsData;
  return data.products;
}

/**
 * 公開中の商品のみ取得
 */
export function getPublishedProducts(): Product[] {
  return getAllProducts().filter((p) => p.isPublished);
}

/**
 * IDで商品を取得
 */
export function getProductById(id: string): Product | undefined {
  return getAllProducts().find((p) => p.id === id);
}

/**
 * カテゴリで商品をフィルタ
 */
export function getProductsByCategory(category: string): Product[] {
  return getPublishedProducts().filter((p) => p.category === category);
}
