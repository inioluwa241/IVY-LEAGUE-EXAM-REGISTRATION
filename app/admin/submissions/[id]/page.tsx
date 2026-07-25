"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

type ExamCode = "BT" | "MA" | "FA" | "CBL";
type Status = "pending" | "approved" | "rejected" | "rescheduled";

const EXAM_NAMES: Record<ExamCode, string> = {
  BT: "Business and Technology",
  MA: "Management Accounting",
  FA: "Financial Accounting",
  CBL: "Corporate and Business Law",
};

const TIME_LABELS: Record<string, string> = {
  "09:45": "9:45 AM",
  "12:15": "12:15 PM",
  "14:15": "2:15 PM",
};

interface Student {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  acca_registration_number: string | null;
  date_of_birth: string | null;
  gender: string | null;
  residence_address: string | null;
  passport_photo_url: string;
  id_document_url: string;
  payment_evidence_url: string;
  created_at: string;
}

interface Registration {
  id: string;
  exam: ExamCode;
  preferred_date: string;
  preferred_time: string;
  status: Status;
  docket_number: string | null;
  docket_url: string | null;
  rejection_reason: string | null;
}

function StatusBadge({ status }: { status: Status }) {
  const variants: Record<
    Status,
    { color: string; icon: React.ReactNode; label: string }
  > = {
    pending: {
      color: "bg-amber-100 text-amber-800 border-amber-200",
      icon: <Clock className="w-3 h-3" />,
      label: "Pending",
    },
    approved: {
      color: "bg-green-100 text-green-800 border-green-200",
      icon: <CheckCircle2 className="w-3 h-3" />,
      label: "Approved",
    },
    rejected: {
      color: "bg-red-100 text-red-800 border-red-200",
      icon: <XCircle className="w-3 h-3" />,
      label: "Rejected",
    },
    rescheduled: {
      color: "bg-blue-100 text-blue-800 border-blue-200",
      icon: <ArrowRight className="w-3 h-3" />,
      label: "Rescheduled",
    },
  };
  const v = variants[status];
  return (
    <Badge
      variant="outline"
      className={`${v.color} flex items-center gap-1.5 w-fit`}
    >
      {v.icon}
      {v.label}
    </Badge>
  );
}

export default function SubmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [capacityDialog, setCapacityDialog] = useState<{
    registrationId: string;
    taken: number;
    capacity: number;
  } | null>(null);

  const [rejectDialog, setRejectDialog] = useState<{
    registrationId: string;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: studentData, error: studentError } = await supabase
      .from("students")
      .select("*")
      .eq("id", studentId)
      .maybeSingle();

    if (studentError || !studentData) {
      setError(studentError?.message ?? "Student not found");
      setLoading(false);
      return;
    }
    setStudent(studentData as Student);

    const { data: regsData, error: regsError } = await supabase
      .from("exam_registrations")
      .select(
        "id, exam, preferred_date, preferred_time, status, docket_number, docket_url, rejection_reason",
      )
      .eq("student_id", studentId)
      .eq("is_current", true)
      .order("created_at", { ascending: true });

    if (regsError) {
      setError(regsError.message);
      setLoading(false);
      return;
    }
    setRegistrations((regsData ?? []) as Registration[]);
    setLoading(false);
  }, [studentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function callAdminFunction(
    fnName: string,
    body: Record<string, unknown>,
  ) {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      throw new Error("You are not signed in. Please log in again.");
    }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${fnName}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
        body: JSON.stringify(body),
      },
    );

    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, json };
  }

  async function handleApprove(registrationId: string, override = false) {
    setActionLoading(registrationId);
    try {
      const { ok, status, json } = await callAdminFunction(
        "approve-registration",
        {
          registrationId,
          override,
        },
      );

      if (!ok && status === 409 && json.error === "slot_at_capacity") {
        setCapacityDialog({
          registrationId,
          taken: json.capacity.taken,
          capacity: json.capacity.capacity,
        });
        return;
      }

      if (!ok) {
        alert(json.error || "Failed to approve registration");
        return;
      }

      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject() {
    if (!rejectDialog) return;
    setActionLoading(rejectDialog.registrationId);
    try {
      const { ok, json } = await callAdminFunction("reject-registration", {
        registrationId: rejectDialog.registrationId,
        reason: rejectReason || null,
      });

      if (!ok) {
        alert(json.error || "Failed to reject registration");
        return;
      }

      setRejectDialog(null);
      setRejectReason("");
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <p className="text-gray-600">Loading submission...</p>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <p className="text-red-600">{error ?? "Student not found"}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <button
          onClick={() => router.push("/admin/submissions")}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-50"
        >
          <ArrowLeft className="w-4 h-4" /> Back to submissions
        </button>

        <h1 className="text-3xl font-bold text-gray-50">{student.full_name}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Student info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Student Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Email" value={student.email} />
              <Row label="Phone" value={student.phone} />
              <Row
                label="ACCA Registration No."
                value={student.acca_registration_number || "Not provided"}
              />
              <Row
                label="Date of Birth"
                value={student.date_of_birth || "Not provided"}
              />
              <Row label="Gender" value={student.gender || "Not provided"} />
              <Row
                label="Address"
                value={student.residence_address || "Not provided"}
              />
              <Row
                label="Submitted"
                value={new Date(student.created_at).toLocaleString()}
              />

              <div className="pt-3 border-t">
                <p className="text-gray-500 font-medium mb-2">Documents</p>
                <div className="flex flex-col gap-1.5">
                  <a
                    href={student.passport_photo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Passport Photograph
                  </a>
                  <a
                    href={student.id_document_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Valid ID
                  </a>
                  <a
                    href={student.payment_evidence_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Payment Evidence
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Exam registrations */}
          <div className="space-y-4">
            {registrations.length === 0 && (
              <Card>
                <CardContent className="pt-6 text-gray-500 text-sm">
                  No exam registrations found for this student.
                </CardContent>
              </Card>
            )}

            {registrations.map((reg) => (
              <Card key={reg.id}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {reg.exam} — {EXAM_NAMES[reg.exam]}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {reg.preferred_date} ·{" "}
                      {TIME_LABELS[reg.preferred_time] ?? reg.preferred_time}
                    </p>
                  </div>
                  <StatusBadge status={reg.status} />
                </CardHeader>
                <CardContent>
                  {reg.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApprove(reg.id)}
                        disabled={actionLoading === reg.id}
                      >
                        {actionLoading === reg.id ? "Working..." : "Approve"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          setRejectDialog({ registrationId: reg.id })
                        }
                        disabled={actionLoading === reg.id}
                      >
                        Reject
                      </Button>
                    </div>
                  )}

                  {reg.status === "approved" && reg.docket_number && (
                    <div className="text-sm">
                      <p className="text-gray-600 mb-1">
                        Docket number:{" "}
                        <span className="font-medium">{reg.docket_number}</span>
                      </p>
                      {reg.docket_url && (
                        <a
                          href={reg.docket_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Download docket
                        </a>
                      )}
                    </div>
                  )}

                  {reg.status === "rejected" && (
                    <p className="text-sm text-gray-600">
                      {reg.rejection_reason
                        ? `Reason: ${reg.rejection_reason}`
                        : "No reason provided."}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Capacity warning dialog */}
      <Dialog
        open={!!capacityDialog}
        onOpenChange={(open) => !open && setCapacityDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>This slot is at capacity</DialogTitle>
            <DialogDescription>
              {capacityDialog &&
                `${capacityDialog.taken}/${capacityDialog.capacity} seats are already taken for this exam, date, and time slot. You can still approve this registration — it will be logged as an override.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCapacityDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (capacityDialog) {
                  const id = capacityDialog.registrationId;
                  setCapacityDialog(null);
                  handleApprove(id, true);
                }
              }}
            >
              Approve anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog
        open={!!rejectDialog}
        onOpenChange={(open) => !open && setRejectDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject this registration</DialogTitle>
            <DialogDescription>
              Optionally, add a reason. The student is not emailed either way.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason (optional)"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!!actionLoading}
            >
              Confirm rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-50 text-right">{value}</span>
    </div>
  );
}
