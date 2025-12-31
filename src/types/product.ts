/**
 * 商品データの型定義
 * shared-data/products.json と同期する
 */

/** 商品カテゴリ */
export type ProductCategory =
  | "雑貨"
  | "ファッション"
  | "コスメ"
  | "グルメ"
  | "体験"
  | "ガジェット"
  | "花・植物"
  | "インテリア";

/** 贈る相手 */
export type Recipient =
  | "彼氏"
  | "彼女"
  | "夫"
  | "妻"
  | "父"
  | "母"
  | "友人男性"
  | "友人女性"
  | "上司"
  | "同僚"
  | "子供";

/** シーン */
export type Occasion =
  | "誕生日"
  | "クリスマス"
  | "バレンタイン"
  | "ホワイトデー"
  | "母の日"
  | "父の日"
  | "結婚祝い"
  | "出産祝い"
  | "引っ越し祝い"
  | "就職祝い"
  | "退職祝い"
  | "お礼"
  | "記念日";

/** 予算帯 */
export type BudgetRange =
  | "〜3,000円"
  | "3,000〜5,000円"
  | "5,000〜10,000円"
  | "10,000〜20,000円"
  | "20,000〜30,000円"
  | "30,000円〜";

/** アフィリエイトプロバイダー */
export type AffiliateProvider = "amazon" | "rakuten" | "yahoo";

/** アフィリエイトリンク */
export interface AffiliateLink {
  provider: AffiliateProvider;
  url: string;
  /** アフィリエイトタグ（例: Amazon アソシエイトID） */
  tag?: string;
}

/** 商品データ */
export interface Product {
  /** 一意のID */
  id: string;
  /** 商品名 */
  name: string;
  /** 商品説明（短文） */
  description: string;
  /** 詳細説明（任意） */
  longDescription?: string;
  /** 価格（税込） */
  price: number;
  /** 画像URL */
  imageUrl: string;
  /** サムネイル画像URL（任意） */
  thumbnailUrl?: string;
  /** カテゴリ */
  category: ProductCategory;
  /** 対象の贈り先（複数可） */
  recipients: Recipient[];
  /** 対象のシーン（複数可） */
  occasions: Occasion[];
  /** 予算帯 */
  budgetRange: BudgetRange;
  /** アフィリエイトリンク（複数プロバイダー対応） */
  affiliateLinks: AffiliateLink[];
  /** タグ（検索・フィルタリング用） */
  tags: string[];
  /** 優先度スコア（高いほど優先表示） */
  priority: number;
  /** 公開状態 */
  isPublished: boolean;
  /** 作成日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt: string;
}

/** 商品データのJSON形式（shared-data用） */
export interface ProductsData {
  version: string;
  lastUpdated: string;
  products: Product[];
}
