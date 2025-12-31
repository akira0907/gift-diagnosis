"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProgressBar } from "@/components/diagnose/ProgressBar";
import { QuestionCard } from "@/components/diagnose/QuestionCard";
import { questions } from "@/data/questions";
import type { Recipient, Occasion, BudgetRange } from "@/types";

interface Answers {
  recipient: { id: string; value: Recipient } | null;
  occasion: { id: string; value: Occasion } | null;
  budget: { id: string; value: BudgetRange } | null;
}

export default function DiagnosePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Answers>({
    recipient: null,
    occasion: null,
    budget: null,
  });

  const currentQuestion = questions[step - 1];
  const totalSteps = questions.length;

  const getCurrentSelectedId = (): string | null => {
    if (step === 1) return answers.recipient?.id ?? null;
    if (step === 2) return answers.occasion?.id ?? null;
    if (step === 3) return answers.budget?.id ?? null;
    return null;
  };

  const handleSelect = (optionId: string) => {
    const option = currentQuestion.options.find((o) => o.id === optionId);
    if (!option) return;

    if (step === 1) {
      setAnswers((prev) => ({
        ...prev,
        recipient: { id: optionId, value: option.value as Recipient },
      }));
    } else if (step === 2) {
      setAnswers((prev) => ({
        ...prev,
        occasion: { id: optionId, value: option.value as Occasion },
      }));
    } else if (step === 3) {
      setAnswers((prev) => ({
        ...prev,
        budget: { id: optionId, value: option.value as BudgetRange },
      }));
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // 結果ページへ遷移
      const params = new URLSearchParams();
      if (answers.recipient) params.set("recipient", answers.recipient.value);
      if (answers.occasion) params.set("occasion", answers.occasion.value);
      if (answers.budget) params.set("budget", answers.budget.value);
      router.push(`/diagnose/result?${params.toString()}`);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const isCurrentStepAnswered = (): boolean => {
    if (step === 1) return answers.recipient !== null;
    if (step === 2) return answers.occasion !== null;
    if (step === 3) return answers.budget !== null;
    return false;
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* ヘッダー */}
      <header className="border-b border-secondary-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-lg font-bold text-primary-600">
            ギフト診断
          </Link>
          <span className="text-sm text-secondary-500">約1分で完了</span>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* プログレスバー */}
        <div className="mb-8">
          <ProgressBar current={step} total={totalSteps} />
        </div>

        {/* 質問カード */}
        <div className="mb-8">
          <QuestionCard
            title={currentQuestion.title}
            description={currentQuestion.description}
            options={currentQuestion.options}
            selectedId={getCurrentSelectedId()}
            onSelect={handleSelect}
          />
        </div>

        {/* ナビゲーションボタン */}
        <div className="flex gap-4">
          {step > 1 && (
            <button
              onClick={handleBack}
              className="flex-1 rounded-full border-2 border-secondary-300 py-4 font-bold text-secondary-700 transition-colors hover:bg-secondary-50"
            >
              戻る
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!isCurrentStepAnswered()}
            className={`flex-1 rounded-full py-4 font-bold text-white transition-colors ${
              isCurrentStepAnswered()
                ? "bg-primary-600 hover:bg-primary-700"
                : "cursor-not-allowed bg-secondary-300"
            }`}
          >
            {step === totalSteps ? "結果を見る" : "次へ"}
          </button>
        </div>
      </div>
    </main>
  );
}
