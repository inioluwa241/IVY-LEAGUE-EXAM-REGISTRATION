"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Upload, FileText } from "lucide-react";

interface Documents {
  passport: { file: File | null; uploaded: boolean };
  ID: { file: File | null; uploaded: boolean };
  payment: { file: File | null; uploaded: boolean };
}

interface Props {
  data: Documents;
  onUpdate: (data: Documents) => void;
}

const DOCUMENT_TYPES = [
  {
    key: "passport",
    label: "Passport",
    description: "Scanned copy of your passport",
  },
  {
    key: "ID",
    label: "Valid ID",
    description: "Scanned copy of your government-issued ID",
  },
  {
    key: "payment",
    label: "Payment Receipt",
    description: "Proof of payment for the registration fee",
  },
];

export default function DocumentUploadSection({ data, onUpdate }: Props) {
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {},
  );

  const handleFileChange = async (
    docType: "passport" | "ID" | "payment",
    file: File | null,
  ) => {
    if (!file) return;

    setUploadingDoc(docType);
    setUploadProgress((prev) => ({ ...prev, [docType]: 0 }));

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        const current = prev[docType] || 0;
        const next = Math.min(current + Math.random() * 40, 95);
        return { ...prev, [docType]: next };
      });
    }, 300);

    // Simulate upload completion
    await new Promise((resolve) => setTimeout(resolve, 1200));
    clearInterval(interval);

    setUploadProgress((prev) => ({ ...prev, [docType]: 100 }));

    onUpdate({
      ...data,
      [docType]: { file, uploaded: true },
    });

    setUploadingDoc(null);
  };

  const uploadedCount = Object.values(data).filter(
    (doc) => doc.uploaded,
  ).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          Documents uploaded:{" "}
          <span className="text-primary">{uploadedCount}/3</span>
        </p>
        <div className="flex gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={`h-2 w-8 rounded-full ${
                i < uploadedCount ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {DOCUMENT_TYPES.map((doc) => {
          const docData = data[doc.key as keyof Documents];
          const isUploading = uploadingDoc === doc.key;
          const progress = uploadProgress[doc.key] || 0;

          return (
            <Card
              key={doc.key}
              className={
                docData.uploaded
                  ? "border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800"
                  : ""
              }
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {docData.uploaded ? (
                      <CheckCircle2 className="size-5 text-green-600" />
                    ) : (
                      <FileText className="size-5 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <p className="font-medium text-sm">{doc.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.description}
                        </p>
                      </div>
                      {docData.uploaded && (
                        <span className="text-xs font-medium text-green-600 whitespace-nowrap ml-2">
                          Uploaded
                        </span>
                      )}
                    </div>

                    {isUploading && (
                      <div className="space-y-1 my-2">
                        <Progress value={progress} className="h-1.5" />
                        <p className="text-xs text-muted-foreground">
                          {Math.round(progress)}%
                        </p>
                      </div>
                    )}

                    {!docData.uploaded && (
                      <label className="mt-2 block">
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) =>
                            handleFileChange(
                              doc.key as any,
                              e.target.files?.[0] || null,
                            )
                          }
                          disabled={isUploading}
                          accept=".pdf,.jpg,.jpeg,.png"
                        />
                        <span
                          className={`inline-flex items-center gap-1 text-sm font-medium cursor-pointer text-primary hover:underline ${
                            isUploading ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          <Upload className="size-3.5" />
                          {isUploading ? "Uploading..." : "Choose file"}
                        </span>
                      </label>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        All documents must be uploaded before proceeding. Accepted formats: PDF,
        JPG, PNG
      </p>
    </div>
  );
}
