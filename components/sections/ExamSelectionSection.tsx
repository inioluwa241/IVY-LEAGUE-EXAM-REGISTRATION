"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock } from "lucide-react";

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
}

const EXAM_DATES: Record<string, string[]> = {
  bt: ["2024-06-15", "2024-07-20", "2024-08-10"],
  ma: ["2024-06-22", "2024-07-27", "2024-08-17"],
  fa: ["2024-06-29", "2024-08-03", "2024-08-24"],
  cbl: ["2024-07-06", "2024-08-10", "2024-08-31"],
};

const TIME_SLOTS = ["09:45 AM", "12:15 PM", "02:15 PM"];

export default function ExamSelectionSection({ data, onUpdate }: Props) {
  const handleToggleExam = (id: string) => {
    const updated = data.map((exam) =>
      exam.id === id ? { ...exam, selected: !exam.selected } : exam,
    );
    onUpdate(updated);
  };

  const handleDateChange = (id: string, date: string) => {
    const updated = data.map((exam) =>
      exam.id === id ? { ...exam, date } : exam,
    );
    onUpdate(updated);
  };

  const handleTimeSlotChange = (id: string, timeSlot: string) => {
    const updated = data.map((exam) =>
      exam.id === id ? { ...exam, timeSlot } : exam,
    );
    onUpdate(updated);
  };

  const selectedExams = data.filter((exam) => exam.selected);

  return (
    <div className="space-y-4">
      {/* <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
          Selected: {selectedExams.length} exam
          {selectedExams.length !== 1 ? "s" : ""} • Total cost: £
          {selectedExams.length * 150}
        </p>
      </div> */}

      <div className="space-y-2">
        {data.map((exam) => {
          const examDates = EXAM_DATES[exam.id] || [];
          const minDate = examDates[0];
          const maxDate = examDates[examDates.length - 1];

          return (
            <Card
              key={exam.id}
              className={
                exam.selected ? "border-blue-300 dark:border-blue-600" : ""
              }
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={exam.selected}
                    onCheckedChange={() => handleToggleExam(exam.id)}
                    className="mt-1"
                  />

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm mb-3">{exam.name}</p>

                    {exam.selected && (
                      <div className="space-y-3 pt-3 border-t">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                              <Calendar className="size-3.5" />
                              Exam Date
                            </label>
                            <Input
                              type="date"
                              className="h-8 text-sm"
                              value={exam.date}
                              min={minDate}
                              max={maxDate}
                              onChange={(e) =>
                                handleDateChange(exam.id, e.target.value)
                              }
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                              <Clock className="size-3.5" />
                              Time Slot
                            </label>
                            <Select
                              value={exam.timeSlot}
                              onValueChange={(val) =>
                                handleTimeSlotChange(exam.id, val)
                              }
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder="Pick a time" />
                              </SelectTrigger>
                              <SelectContent>
                                {TIME_SLOTS.map((slot) => (
                                  <SelectItem key={slot} value={slot}>
                                    {slot}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* <p className="text-xs text-muted-foreground">
        Select at least one exam to proceed. Each exam costs £150.
      </p> */}
    </div>
  );
}
