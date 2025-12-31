/**
 * アナリティクス（GA4）イベントの型定義
 */

/** 診断関連イベント */
export type DiagnoseEventName =
  | "diagnose_start" // 診断開始
  | "diagnose_step" // 各ステップ完了
  | "diagnose_complete" // 診断完了
  | "diagnose_abandon"; // 診断離脱

/** 商品関連イベント */
export type ProductEventName =
  | "product_view" // 商品閲覧
  | "product_click" // 商品カードクリック
  | "affiliate_click"; // アフィリエイトリンククリック

/** すべてのカスタムイベント */
export type CustomEventName = DiagnoseEventName | ProductEventName;

/** 診断開始イベントのパラメータ */
export interface DiagnoseStartParams {
  session_id: string;
}

/** 診断ステップイベントのパラメータ */
export interface DiagnoseStepParams {
  session_id: string;
  step_number: number;
  step_name: string;
  selected_option: string;
}

/** 診断完了イベントのパラメータ */
export interface DiagnoseCompleteParams {
  session_id: string;
  total_steps: number;
  recipient?: string;
  occasion?: string;
  budget_range?: string;
  matched_products_count: number;
}

/** 診断離脱イベントのパラメータ */
export interface DiagnoseAbandonParams {
  session_id: string;
  last_step: number;
}

/** 商品閲覧イベントのパラメータ */
export interface ProductViewParams {
  product_id: string;
  product_name: string;
  product_category: string;
  price: number;
}

/** 商品クリックイベントのパラメータ */
export interface ProductClickParams {
  product_id: string;
  product_name: string;
  product_category: string;
  price: number;
  position: number; // 結果リスト内の位置
}

/** アフィリエイトクリックイベントのパラメータ */
export interface AffiliateClickParams {
  product_id: string;
  product_name: string;
  affiliate_provider: "amazon" | "rakuten" | "yahoo";
  price: number;
  session_id?: string;
}

/** イベント名とパラメータの対応マップ */
export interface EventParamsMap {
  diagnose_start: DiagnoseStartParams;
  diagnose_step: DiagnoseStepParams;
  diagnose_complete: DiagnoseCompleteParams;
  diagnose_abandon: DiagnoseAbandonParams;
  product_view: ProductViewParams;
  product_click: ProductClickParams;
  affiliate_click: AffiliateClickParams;
}
