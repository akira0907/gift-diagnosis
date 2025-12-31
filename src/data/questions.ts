/**
 * 診断の質問データ
 */

import type { Recipient, Occasion, BudgetRange } from "@/types";

export interface QuestionOption<T> {
  id: string;
  label: string;
  value: T;
  icon: string;
}

export interface Question<T> {
  id: string;
  title: string;
  description: string;
  options: QuestionOption<T>[];
}

// Step 1: 誰に贈る？
export const recipientQuestion: Question<Recipient> = {
  id: "recipient",
  title: "誰に贈りますか？",
  description: "プレゼントを贈る相手を選んでください",
  options: [
    { id: "r1", label: "彼氏", value: "彼氏", icon: "👨" },
    { id: "r2", label: "彼女", value: "彼女", icon: "👩" },
    { id: "r3", label: "夫", value: "夫", icon: "🧔" },
    { id: "r4", label: "妻", value: "妻", icon: "👱‍♀️" },
    { id: "r5", label: "父", value: "父", icon: "👴" },
    { id: "r6", label: "母", value: "母", icon: "👵" },
    { id: "r7", label: "友人（男性）", value: "友人男性", icon: "🧑" },
    { id: "r8", label: "友人（女性）", value: "友人女性", icon: "👧" },
    { id: "r9", label: "上司・同僚", value: "上司", icon: "💼" },
  ],
};

// Step 2: どんなシーン？
export const occasionQuestion: Question<Occasion> = {
  id: "occasion",
  title: "どんなシーンですか？",
  description: "プレゼントを贈るシーンを選んでください",
  options: [
    { id: "o1", label: "誕生日", value: "誕生日", icon: "🎂" },
    { id: "o2", label: "クリスマス", value: "クリスマス", icon: "🎄" },
    { id: "o3", label: "記念日", value: "記念日", icon: "💝" },
    { id: "o4", label: "バレンタイン", value: "バレンタイン", icon: "🍫" },
    { id: "o5", label: "ホワイトデー", value: "ホワイトデー", icon: "🍬" },
    { id: "o6", label: "母の日", value: "母の日", icon: "🌸" },
    { id: "o7", label: "父の日", value: "父の日", icon: "👔" },
    { id: "o8", label: "お礼・感謝", value: "お礼", icon: "🙏" },
    { id: "o9", label: "結婚・出産祝い", value: "結婚祝い", icon: "💒" },
  ],
};

// Step 3: 予算は？
export const budgetQuestion: Question<BudgetRange> = {
  id: "budget",
  title: "予算はどのくらいですか？",
  description: "ご予算の範囲を選んでください",
  options: [
    { id: "b1", label: "〜3,000円", value: "〜3,000円", icon: "💰" },
    { id: "b2", label: "3,000〜5,000円", value: "3,000〜5,000円", icon: "💰" },
    { id: "b3", label: "5,000〜10,000円", value: "5,000〜10,000円", icon: "💎" },
    {
      id: "b4",
      label: "10,000〜20,000円",
      value: "10,000〜20,000円",
      icon: "💎",
    },
    {
      id: "b5",
      label: "20,000〜30,000円",
      value: "20,000〜30,000円",
      icon: "👑",
    },
    { id: "b6", label: "30,000円〜", value: "30,000円〜", icon: "👑" },
  ],
};

export const questions = [recipientQuestion, occasionQuestion, budgetQuestion];
