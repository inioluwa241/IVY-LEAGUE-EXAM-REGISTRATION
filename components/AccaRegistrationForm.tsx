"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import PersonalDetailsSection from "./sections/PersonalDetailsSection";
import DocumentUploadSection from "./sections/DocumentUploadSection";
import ExamSelectionSection from "./sections/ExamSelectionSection";
import ReviewSection from "./sections/ReviewSection";
import SuccessScreen from "./sections/SuccessScreen";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export interface FormData {
  personalDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    gender: string;
    residenceAddress: string;
    accaRegNo: string;
  };
  documents: {
    passport: { file: File | null; uploaded: boolean };
    ID: { file: File | null; uploaded: boolean };
    payment: { file: File | null; uploaded: boolean };
  };
  exams: Array<{
    id: string;
    name: string;
    selected: boolean;
    date: string;
    timeSlot: string;
  }>;
}

const EXAMS = [
  {
    id: "BT",
    name: "BT - Business and Technology",
    dates: ["2026-08-04", "2026-08-11", "2026-08-18"],
  },
  {
    id: "MA",
    name: "MA - Management Accounting",
    dates: ["2026-08-05", "2026-08-12", "2026-08-19"],
  },
  {
    id: "FA",
    name: "FA - Financial Accounting",
    dates: ["2026-08-06", "2026-08-13", "2026-08-20"],
  },
  {
    id: "CBL",
    name: "CBL - Corporate and Business Law",
    dates: ["2026-08-07", "2026-08-14", "2026-08-21"],
  },
];

const TIME_SLOTS = ["09:45", "12:15", "14:15"];

export default function AccaRegistrationForm() {
  const [currentSection, setCurrentSection] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    personalDetails: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      gender: "",
      residenceAddress: "",
      accaRegNo: "",
    },
    documents: {
      passport: { file: null, uploaded: false },
      ID: { file: null, uploaded: false },
      payment: { file: null, uploaded: false },
    },
    exams: EXAMS.map((exam) => ({
      id: exam.id,
      name: exam.name,
      selected: false,
      date: exam.dates[0],
      timeSlot: TIME_SLOTS[0],
    })),
  });

  const updatePersonalDetails = (details: FormData["personalDetails"]) => {
    setFormData((prev) => ({
      ...prev,
      personalDetails: details,
    }));
  };

  const updateDocuments = (documents: FormData["documents"]) => {
    setFormData((prev) => ({
      ...prev,
      documents,
    }));
  };

  const updateExams = (exams: FormData["exams"]) => {
    setFormData((prev) => ({
      ...prev,
      exams,
    }));
  };

  // 3. completion check — add gender & residenceAddress since they're required
  const isPersonalDetailsComplete =
    formData.personalDetails.firstName &&
    formData.personalDetails.lastName &&
    formData.personalDetails.email &&
    formData.personalDetails.phone &&
    formData.personalDetails.dateOfBirth &&
    formData.personalDetails.gender &&
    formData.personalDetails.residenceAddress;

  const areDocumentsComplete =
    formData.documents.passport.uploaded &&
    formData.documents.ID.uploaded &&
    formData.documents.payment.uploaded;

  const areExamsSelected = formData.exams.some((exam) => exam.selected);

  const canProceedToDocuments = isPersonalDetailsComplete;
  const canProceedToExams = canProceedToDocuments && areDocumentsComplete;
  const canSubmit = canProceedToExams && areExamsSelected;

  const handleNext = () => {
    if (currentSection < 3) {
      setCurrentSection(currentSection + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const { personalDetails, documents, exams } = formData;

      const uploadDocument = async (
        file: File,
        folder: "passport" | "id" | "payment",
      ): Promise<string> => {
        const ext = file.name.split(".").pop();
        const path = `${crypto.randomUUID()}/${folder}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("student-documents")
          .upload(path, file, { upsert: false });

        if (uploadError) {
          throw new Error(`Failed to upload ${folder}: ${uploadError.message}`);
        }

        return path;
      };

      if (
        !documents.passport.file ||
        !documents.ID.file ||
        !documents.payment.file
      ) {
        throw new Error("All 3 documents must be uploaded before submitting");
      }

      const [passportPhotoPath, idDocumentPath, paymentEvidencePath] =
        await Promise.all([
          uploadDocument(documents.passport.file, "passport"),
          uploadDocument(documents.ID.file, "id"),
          uploadDocument(documents.payment.file, "payment"),
        ]);

      const registrations = exams
        .filter((exam) => exam.selected)
        .map((exam) => ({
          exam: exam.id,
          preferredDate: exam.date,
          preferredTime: exam.timeSlot,
        }));

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/submit-registration`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          },
          body: JSON.stringify({
            fullName:
              `${personalDetails.firstName} ${personalDetails.lastName}`.trim(),
            email: personalDetails.email,
            phone: personalDetails.phone,
            accaRegistrationNumber: personalDetails.accaRegNo || null,
            dateOfBirth: personalDetails.dateOfBirth || null,
            gender: personalDetails.gender || null,
            residenceAddress: personalDetails.residenceAddress || null,
            passportPhotoPath,
            idDocumentPath,
            paymentEvidencePath,
            registrations,
          }),
        },
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Registration failed: ${res.status}`);
      }

      setShowSuccess(true);
    } catch (err) {
      console.error(err);
      // TODO: show error to user — e.g. a toast, or a state flag
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return <SuccessScreen />;
  }

  const progress = ((currentSection + 1) / 4) * 100;
  const sections = [
    {
      title: "Personal Details",
      description: "Enter your basic information",
      component: (
        <PersonalDetailsSection
          data={formData.personalDetails}
          onUpdate={updatePersonalDetails}
        />
      ),
    },
    {
      title: "Document Upload",
      description: "Upload your required documents",
      component: (
        <DocumentUploadSection
          data={formData.documents}
          onUpdate={updateDocuments}
        />
      ),
    },
    {
      title: "Exam Selection",
      description: "Choose your exams and schedule",
      component: (
        <ExamSelectionSection data={formData.exams} onUpdate={updateExams} />
      ),
    },
    {
      title: "Review & Submit",
      description: "Verify your information",
      component: <ReviewSection data={formData} />,
    },
  ];

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">ACCA Registration</h1>
          <p className="text-muted-foreground">
            Complete your registration in 4 simple steps
          </p>
        </div>

        <Progress value={progress} className="mb-8" />

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold">
                {currentSection + 1}
              </div>
              <div>
                <CardTitle>{sections[currentSection].title}</CardTitle>
                <CardDescription>
                  {sections[currentSection].description}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {sections[currentSection].component}

            <div className="flex gap-3 pt-6 border-t">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentSection === 0}
              >
                Previous
              </Button>
              <div className="flex-1" />
              {currentSection < 3 ? (
                <Button
                  onClick={handleNext}
                  disabled={
                    (currentSection === 0 && !canProceedToDocuments) ||
                    (currentSection === 1 && !canProceedToExams) ||
                    (currentSection === 2 && !areExamsSelected)
                  }
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit || isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Registration"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
