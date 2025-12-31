/**
 * 商品マッチングエンジン
 */

import type { Product, DiagnoseFilters } from "@/types";

/**
 * フィルタ条件に基づいて商品をマッチング
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
      // 予算でフィルタ
      if (filters.budgetRange && p.budgetRange !== filters.budgetRange) {
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
