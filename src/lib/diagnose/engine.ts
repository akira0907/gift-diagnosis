/**
 * 商品マッチングエンジン
 */

import type { Product, DiagnoseFilters, BudgetRange } from "@/types";

/**
 * 価格から予算帯を判定
 * 予算帯の定義:
 * - 〜3,000円: 0円〜2,999円
 * - 3,000〜5,000円: 3,000円〜4,999円
 * - 5,000〜10,000円: 5,000円〜9,999円
 * - 10,000〜20,000円: 10,000円〜19,999円
 * - 20,000〜30,000円: 20,000円〜29,999円
 * - 30,000円〜: 30,000円以上
 */
export function getBudgetRangeFromPrice(price: number): BudgetRange {
  if (price < 3000) return "〜3,000円";
  if (price < 5000) return "3,000〜5,000円";
  if (price < 10000) return "5,000〜10,000円";
  if (price < 20000) return "10,000〜20,000円";
  if (price < 30000) return "20,000〜30,000円";
  return "30,000円〜";
}

/**
 * 商品の価格が指定された予算帯に含まれるかチェック
 */
export function isPriceInBudgetRange(price: number, budgetRange: BudgetRange): boolean {
  return getBudgetRangeFromPrice(price) === budgetRange;
}

/**
 * フィルタ条件に基づいて商品をマッチング
 * 予算フィルタは商品の実際の価格(price)に基づいて判定
 */
export function matchProducts(
  products: Product[],
  filters: DiagnoseFilters
): Product[] {
  return products
    .filter((p) => p.isPublished)
    .filter((p) => {
      // 贈り先でフィルタ
      if (filters.recipient && !p.recipients.includes(filters.recipient)) {
        return false;
      }
      // シーンでフィルタ
      if (filters.occasion && !p.occasions.includes(filters.occasion)) {
        return false;
      }
      // 予算でフィルタ（実際の価格で判定）
      if (filters.budgetRange && !isPriceInBudgetRange(p.price, filters.budgetRange)) {
        return false;
      }
      return true;
    })
    .sort((a, b) => b.priority - a.priority);
}

/**
 * マッチ結果が少ない場合、条件を緩和して追加候補を取得
 */
export function getRelaxedMatches(
  products: Product[],
  filters: DiagnoseFilters,
  excludeIds: string[],
  limit: number = 3
): Product[] {
  // 予算条件を外して検索
  const relaxedFilters: DiagnoseFilters = {
    recipient: filters.recipient,
    occasion: filters.occasion,
  };

  return products
    .filter((p) => p.isPublished)
    .filter((p) => !excludeIds.includes(p.id))
    .filter((p) => {
      if (
        relaxedFilters.recipient &&
        !p.recipients.includes(relaxedFilters.recipient)
      ) {
        return false;
      }
      if (
        relaxedFilters.occasion &&
        !p.occasions.includes(relaxedFilters.occasion)
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit);
}

/**
 * 診断結果のサマリーテキストを生成
 */
export function generateSummary(filters: DiagnoseFilters): string {
  const parts: string[] = [];

  if (filters.recipient) {
    parts.push(`${filters.recipient}へ`);
  }
  if (filters.occasion) {
    parts.push(`${filters.occasion}の`);
  }
  if (filters.budgetRange) {
    parts.push(`${filters.budgetRange}で`);
  }

  if (parts.length === 0) {
    return "あなたにおすすめのギフト";
  }

  return `${parts.join("")}贈るおすすめギフト`;
}

/**
 * 結果IDを生成（シェア用）
 */
export function generateResultId(filters: DiagnoseFilters): string {
  const data = JSON.stringify(filters);
  // 簡易的なハッシュ生成
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
