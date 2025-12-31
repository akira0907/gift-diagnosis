/**
 * 診断フローの型定義
 */

import type { BudgetRange, Occasion, Recipient } from "./product";

/** 診断の質問タイプ */
export type QuestionType = "single" | "multiple";

/** 質問の選択肢 */
export interface QuestionOption {
  id: string;
  label: string;
  /** アイコン（emoji or URL） */
  icon?: string;
  /** この選択肢を選んだ時のスコア加算 */
  scores?: Record<string, number>;
}

/** 診断の質問 */
export interface DiagnoseQuestion {
  id: string;
  /** 質問文 */
  question: string;
  /** 補足説明 */
  description?: string;
  /** 質問タイプ */
  type: QuestionType;
  /** 選択肢 */
  options: QuestionOption[];
  /** 必須かどうか */
  required: boolean;
}

/** ユーザーの回答 */
export interface UserAnswer {
  questionId: string;
  /** 選択した選択肢のID（複数可） */
  selectedOptionIds: string[];
}

/** 診断セッション */
export interface DiagnoseSession {
  /** セッションID */
  id: string;
  /** 開始日時 */
  startedAt: string;
  /** 完了日時 */
  completedAt?: string;
  /** 回答一覧 */
  answers: UserAnswer[];
  /** フィルタリング条件 */
  filters: DiagnoseFilters;
}

/** 診断のフィルタリング条件 */
export interface DiagnoseFilters {
  recipient?: Recipient;
  occasion?: Occasion;
  budgetRange?: BudgetRange;
}

/** 診断結果 */
export interface DiagnoseResult {
  /** 結果ID（シェア用） */
  id: string;
  /** セッションID */
  sessionId: string;
  /** フィルタ条件 */
  filters: DiagnoseFilters;
  /** マッチした商品ID一覧（スコア順） */
  matchedProductIds: string[];
  /** 診断サマリーテキスト */
  summary: string;
  /** 作成日時 */
  createdAt: string;
}

/** 診断フローの設定 */
export interface DiagnoseConfig {
  /** 診断の質問一覧 */
  questions: DiagnoseQuestion[];
  /** 結果表示する商品数の上限 */
  maxResultProducts: number;
}
