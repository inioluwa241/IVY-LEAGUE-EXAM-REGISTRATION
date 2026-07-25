"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import type { FormData } from "../AccaRegistrationForm";

interface Props {
  data: FormData;
}

export default function ReviewSection({ data }: Props) {
  const selectedExams = data.exams.filter((exam) => exam.selected);
  const totalCost = selectedExams.length * 150;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateOfBirth = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatGender = (gender: string) => {
    if (gender === "prefer-not-to-say") return "Prefer not to say";
    return gender.charAt(0).toUpperCase() + gender.slice(1);
  };

  return (
    <div className="space-y-4">
      {/* Personal Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Name:</span>
              <span className="font-medium text-sm">
                {data.personalDetails.firstName} {data.personalDetails.lastName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Email:</span>
              <span className="font-medium text-sm">
                {data.personalDetails.email}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Phone:</span>
              <span className="font-medium text-sm">
                {data.personalDetails.phone}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Date of Birth:
              </span>
              <span className="font-medium text-sm">
                {formatDateOfBirth(data.personalDetails.dateOfBirth)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Gender:</span>
              <span className="font-medium text-sm">
                {formatGender(data.personalDetails.gender)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                ACCA Reg. No:
              </span>
              <span className="font-medium text-sm">
                {data.personalDetails.accaRegNo || "—"}
              </span>
            </div>
          </div>
          <div className="flex items-start gap-2 pt-1">
            <span className="text-sm text-muted-foreground">Address:</span>
            <span className="font-medium text-sm">
              {data.personalDetails.residenceAddress}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="space-y-1.5">
            {Object.entries({
              passport: "Passport",
              ID: "Valid ID Card",
              payment: "Proof of Payment",
            }).map(([key, label]) => (
              <div key={key} className="flex items-center gap-2">
                <Check className="size-4 text-green-600" />
                <span className="text-sm">{label}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            All documents have been successfully uploaded.
          </p>
        </CardContent>
      </Card>

      {/* Selected Exams */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Exams</CardTitle>
            <Badge variant="secondary">{selectedExams.length} selected</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {selectedExams.map((exam) => (
            <div
              key={exam.id}
              className="p-3 rounded-lg border border-muted bg-muted/30"
            >
              <p className="font-medium text-sm mb-1.5">{exam.name}</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>
                  <span className="font-medium">Date:</span>{" "}
                  {formatDate(exam.date)}
                </div>
                <div>
                  <span className="font-medium">Time:</span> {exam.timeSlot}
                </div>
              </div>
            </div>
          ))}

          {/* <div className="pt-3 border-t">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Total Registration Fee:</span>
              <span className="text-lg font-bold text-primary">£{totalCost}</span>
            </div>
          </div> */}
        </CardContent>
      </Card>

      <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
        <p className="text-sm text-amber-900 dark:text-amber-100">
          <span className="font-medium">
            Please review all information carefully.
          </span>{" "}
          Once submitted, you will receive a confirmation email within 24 hours.
        </p>
      </div>
    </div>
  );
}
