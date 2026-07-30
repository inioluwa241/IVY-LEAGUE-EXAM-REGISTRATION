"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";

type ExamCode = "BT" | "MA" | "FA" | "CBL";

const TIME_SLOTS: { value: string; label: string }[] = [
  { value: "09:45", label: "9:45 AM" },
  { value: "12:15", label: "12:15 PM" },
  { value: "14:15", label: "2:15 PM" },
];

const TIME_LABELS: Record<string, string> = {
  "09:45": "9:45 AM",
  "12:15": "12:15 PM",
  "14:15": "2:15 PM",
};

interface StudentRow {
  id: string;
  full_name: string;
  email: string;
}

interface RegistrationRow {
  id: string;
  student_id: string;
  exam: ExamCode;
  preferred_date: string;
  preferred_time: string;
  docket_number: string | null;
}

type Step = "search" | "select" | "reschedule" | "success";

export default function ReschedulePage() {
  const [currentStep, setCurrentStep] = useState<Step>("search");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [students, setStudents] = useState<StudentRow[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<StudentRow | null>(
    null,
  );
  const [selectedRegistration, setSelectedRegistration] =
    useState<RegistrationRow | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  const [showCapacityDialog, setShowCapacityDialog] = useState(false);
  const [capacityInfo, setCapacityInfo] = useState<{
    taken: number;
    capacity: number;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [newDocket, setNewDocket] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      // Only registrations that are currently approved can be rescheduled.
      const { data, error: fetchError } = await supabase
        .from("exam_registrations")
        .select(
          "id, student_id, exam, preferred_date, preferred_time, docket_number, students(id, full_name, email)",
        )
        .eq("status", "approved")
        .eq("is_current", true);

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      const studentMap = new Map<string, StudentRow>();
      const regs: RegistrationRow[] = [];

      (data ?? []).forEach((row: any) => {
        if (row.students) {
          studentMap.set(row.students.id, {
            id: row.students.id,
            full_name: row.students.full_name,
            email: row.students.email,
          });
        }
        regs.push({
          id: row.id,
          student_id: row.student_id,
          exam: row.exam,
          preferred_date: row.preferred_date,
          preferred_time: row.preferred_time,
          docket_number: row.docket_number,
        });
      });

      setStudents(Array.from(studentMap.values()));
      setRegistrations(regs);
      setLoading(false);
    }

    load();
  }, []);

  const filteredStudents = useMemo(() => {
    if (!searchQuery) return [];
    const q = searchQuery.toLowerCase();
    return students.filter(
      (s) =>
        s.full_name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q),
    );
  }, [students, searchQuery]);

  const studentRegistrations = selectedStudent
    ? registrations.filter((r) => r.student_id === selectedStudent.id)
    : [];

  function handleSelectStudent(student: StudentRow) {
    setSelectedStudent(student);
    setSearchQuery("");
  }

  function handleSelectRegistration(reg: RegistrationRow) {
    setSelectedRegistration(reg);
    setNewDate("");
    setNewTime("");
    setActionError(null);
    setCurrentStep("reschedule");
  }

  async function callReschedule(override = false) {
    if (!selectedRegistration) return;
    setSubmitting(true);
    setActionError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setActionError("You are not signed in. Please log in again.");
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/reschedule-registration`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          },
          body: JSON.stringify({
            registrationId: selectedRegistration.id,
            newDate,
            newTime,
            override,
          }),
        },
      );

      const json = await res.json().catch(() => ({}));

      if (!res.ok && res.status === 409 && json.error === "slot_at_capacity") {
        setCapacityInfo({
          taken: json.capacity.taken,
          capacity: json.capacity.capacity,
        });
        setShowCapacityDialog(true);
        return;
      }

      if (!res.ok) {
        setActionError(json.error || "Failed to reschedule");
        return;
      }

      setNewDocket(json.docketNumber);
      setCurrentStep("success");
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Something went wrong",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleRescheduleAnother() {
    setCurrentStep("search");
    setSearchQuery("");
    setSelectedStudent(null);
    setSelectedRegistration(null);
    setNewDate("");
    setNewTime("");
    setNewDocket("");
    setActionError(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <p className="text-muted-foreground">
          Loading approved registrations...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <p className="text-destructive">Failed to load: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Reschedule Registration
          </h1>
          <p className="text-muted-foreground mt-1">
            Modify approved exam registrations for students
          </p>
        </div>

        {currentStep === "search" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Find Student</CardTitle>
                <CardDescription>
                  Search by name or email to find their approved registration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label
                    htmlFor="search"
                    className="text-sm font-medium text-foreground"
                  >
                    Student Name or Email
                  </label>
                  <Input
                    id="search"
                    type="text"
                    placeholder="Type to search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="mt-2"
                  />
                </div>

                {filteredStudents.length > 0 && (
                  <div className="space-y-2 max-h-64 overflow-y-auto border border-border rounded-lg p-3">
                    {filteredStudents.map((student) => (
                      <button
                        key={student.id}
                        onClick={() => handleSelectStudent(student)}
                        className="w-full text-left p-3 rounded hover:bg-muted transition-colors border border-transparent hover:border-blue-200"
                      >
                        <p className="font-medium text-foreground">
                          {student.full_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {student.email}
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                {searchQuery && filteredStudents.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    <p>
                      No students with approved registrations match "
                      {searchQuery}"
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedStudent && (
              <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Selected Student
                      </p>
                      <p className="text-lg font-semibold text-foreground">
                        {selectedStudent.full_name}
                      </p>
                    </div>
                    <Button onClick={() => setCurrentStep("select")}>
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {currentStep === "select" && selectedStudent && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Select Registration to Reschedule
                </CardTitle>
                <CardDescription>
                  Showing approved registrations for {selectedStudent.full_name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {studentRegistrations.length > 0 ? (
                  <div className="space-y-3">
                    {studentRegistrations.map((reg) => (
                      <button
                        key={reg.id}
                        onClick={() => handleSelectRegistration(reg)}
                        className="w-full text-left p-4 border border-border rounded-lg hover:border-blue-300 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className="bg-green-100 text-green-800 border-green-200">
                                Approved
                              </Badge>
                              <span className="font-semibold text-foreground">
                                {reg.exam}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {reg.preferred_date} at{" "}
                              {TIME_LABELS[reg.preferred_time] ??
                                reg.preferred_time}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Docket: {reg.docket_number}
                            </p>
                          </div>
                          <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No approved registrations found for this student</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentStep("search");
                  setSelectedStudent(null);
                  setSearchQuery("");
                }}
              >
                Back
              </Button>
            </div>
          </div>
        )}

        {currentStep === "reschedule" && selectedRegistration && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Current Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Exam</p>
                    <p className="text-lg font-semibold text-foreground">
                      {selectedRegistration.exam}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="text-lg font-semibold text-foreground">
                      {selectedRegistration.preferred_date}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Time</p>
                    <p className="text-lg font-semibold text-foreground">
                      {TIME_LABELS[selectedRegistration.preferred_time] ??
                        selectedRegistration.preferred_time}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg">Select New Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label
                    htmlFor="new-date"
                    className="text-sm font-medium text-foreground"
                  >
                    New Date
                  </label>
                  <Input
                    id="new-date"
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-3">
                    Time Slot
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {TIME_SLOTS.map((slot) => (
                      <Button
                        key={slot.value}
                        variant={newTime === slot.value ? "default" : "outline"}
                        onClick={() => setNewTime(slot.value)}
                        className="h-12"
                      >
                        {slot.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {newDate && newTime && (
                  <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 dark:text-green-100">
                      New schedule selected: {newDate} at {TIME_LABELS[newTime]}
                    </AlertDescription>
                  </Alert>
                )}

                {actionError && (
                  <p className="text-sm text-destructive">{actionError}</p>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentStep("select");
                  setSelectedRegistration(null);
                }}
              >
                Back
              </Button>
              <Button
                disabled={!newDate || !newTime || submitting}
                onClick={() => callReschedule(false)}
                className="ml-auto"
              >
                {submitting ? "Checking..." : "Check Capacity & Reschedule"}
              </Button>
            </div>
          </div>
        )}

        {currentStep === "success" &&
          selectedRegistration &&
          selectedStudent && (
            <div className="space-y-6">
              <Card className="border-green-200 bg-green-50 dark:bg-green-950">
                <CardContent className="pt-8">
                  <div className="text-center space-y-4">
                    <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
                    <h2 className="text-2xl font-bold text-green-900 dark:text-green-100">
                      Reschedule Successful
                    </h2>
                    <p className="text-green-800 dark:text-green-200">
                      A new docket has been generated and emailed to the student
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Updated Registration Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Student</p>
                      <p className="text-sm font-semibold text-foreground">
                        {selectedStudent.full_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Exam</p>
                      <p className="text-sm font-semibold text-foreground">
                        {selectedRegistration.exam}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">New Date</p>
                      <p className="text-sm font-semibold text-foreground">
                        {newDate}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">New Time</p>
                      <p className="text-sm font-semibold text-foreground">
                        {TIME_LABELS[newTime]}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">
                        New Docket Number
                      </p>
                      <p className="text-lg font-mono font-semibold text-blue-600">
                        {newDocket}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={handleRescheduleAnother}
                  className="w-full sm:w-auto"
                >
                  Reschedule Another
                </Button>
              </div>
            </div>
          )}

        <Dialog open={showCapacityDialog} onOpenChange={setShowCapacityDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                This slot is at capacity
              </DialogTitle>
              <DialogDescription>
                {capacityInfo &&
                  `${capacityInfo.taken}/${capacityInfo.capacity} seats are already taken for this exam, date, and time slot.`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCapacityDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowCapacityDialog(false);
                  callReschedule(true);
                }}
              >
                Reschedule anyway
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
