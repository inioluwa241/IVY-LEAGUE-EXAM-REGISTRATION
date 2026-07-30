"use client";

import { Card, CardContent } from "@/components/ui/card";
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

// TODO: once the admin Calendar page is wired to real exam_calendar data,
// replace this with a live fetch of actually-open dates per exam instead
// of a hardcoded placeholder range.
const MIN_DATE = "2026-08-01";
const MAX_DATE = "2026-12-31";

// Backend only accepts these 3 exact values — label shown to the
// student, but the stored value must stay one of these three strings.
const TIME_SLOTS: { value: string; label: string }[] = [
  { value: "09:45", label: "9:45 AM" },
  { value: "12:15", label: "12:15 PM" },
  { value: "14:15", label: "2:15 PM" },
];

export default function DateTimeSection({ data, onUpdate }: Props) {
  const selectedExams = data.filter((exam) => exam.selected);

  const handleDateChange = (id: string, date: string) => {
    onUpdate(data.map((exam) => (exam.id === id ? { ...exam, date } : exam)));
  };

  const handleTimeSlotChange = (id: string, timeSlot: string) => {
    onUpdate(
      data.map((exam) => (exam.id === id ? { ...exam, timeSlot } : exam)),
    );
  };

  return (
    <div className="space-y-4">
      {selectedExams.map((exam) => (
        <Card key={exam.id}>
          <CardContent className="p-4 space-y-3">
            <p className="font-medium text-sm">{exam.name}</p>

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
                  min={MIN_DATE}
                  max={MAX_DATE}
                  onChange={(e) => handleDateChange(exam.id, e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Clock className="size-3.5" />
                  Time Slot
                </label>
                <Select
                  value={exam.timeSlot}
                  onValueChange={(val) => handleTimeSlotChange(exam.id, val)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Pick a time" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((slot) => (
                      <SelectItem key={slot.value} value={slot.value}>
                        {slot.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
