"use client";

interface QuestionOption {
  id: string;
  label: string;
  icon: string;
}

interface QuestionCardProps {
  title: string;
  description: string;
  options: QuestionOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function QuestionCard({
  title,
  description,
  options,
  selectedId,
  onSelect,
}: QuestionCardProps) {
  return (
    <div className="w-full">
      <h2 className="mb-2 text-2xl font-bold text-secondary-900">{title}</h2>
      <p className="mb-6 text-secondary-600">{description}</p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            className={`flex flex-col items-center rounded-xl border-2 p-4 transition-all ${
              selectedId === option.id
                ? "border-primary-500 bg-primary-50 shadow-md"
                : "border-secondary-200 bg-white hover:border-primary-300 hover:bg-primary-50/50"
            }`}
          >
            <span className="mb-2 text-3xl">{option.icon}</span>
            <span
              className={`text-sm font-medium ${
                selectedId === option.id
                  ? "text-primary-700"
                  : "text-secondary-700"
              }`}
            >
              {option.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
