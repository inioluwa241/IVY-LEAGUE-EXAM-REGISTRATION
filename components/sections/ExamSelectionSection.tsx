"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

interface Exam {
  id: string;
  name: string;
  selected: boolean;
  date: string;
  timeSlot: string;
}

interface Props {
  data: Exam[];
  onUpdate: (exams: Exam[]) => void;
  prices: Record<string, number>; // exam id -> price in kobo
}

export default function ExamSelectionSection({
  data,
  onUpdate,
  prices,
}: Props) {
  const handleToggleExam = (id: string) => {
    const updated = data.map((exam) =>
      exam.id === id ? { ...exam, selected: !exam.selected } : exam,
    );
    onUpdate(updated);
  };

  const selectedExams = data.filter((exam) => exam.selected);
  const totalKobo = selectedExams.reduce(
    (sum, exam) => sum + (prices[exam.id] ?? 0),
    0,
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {data.map((exam) => {
          const priceKobo = prices[exam.id];
          const priceNaira =
            priceKobo != null ? (priceKobo / 100).toLocaleString() : "...";

          return (
            <Card
              key={exam.id}
              className={
                exam.selected ? "border-blue-300 dark:border-blue-600" : ""
              }
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={exam.selected}
                    onCheckedChange={() => handleToggleExam(exam.id)}
                  />
                  <div className="flex-1 min-w-0 flex items-center justify-between">
                    <p className="font-medium text-sm">{exam.name}</p>
                    <p className="text-sm text-muted-foreground whitespace-nowrap">
                      ₦{priceNaira}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedExams.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Selected: {selectedExams.length} exam
            {selectedExams.length !== 1 ? "s" : ""} · Total: ₦
            {(totalKobo / 100).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}
