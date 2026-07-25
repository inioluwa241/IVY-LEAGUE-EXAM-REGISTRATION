"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowRight, CheckCircle2, Clock, XCircle } from "lucide-react";

type ExamCode = "BT" | "MA" | "FA" | "CBL";
type Status = "pending" | "approved" | "rejected" | "rescheduled";

interface RegistrationRow {
  id: string;
  exam: ExamCode;
  status: Status;
  student_id: string;
  created_at: string;
}

interface RecentStudent {
  id: string;
  full_name: string;
  created_at: string;
  exams: { exam: ExamCode; status: Status }[];
}

const EXAMS: ExamCode[] = ["BT", "MA", "FA", "CBL"];

function getStatusBadge(status: Status) {
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
  const variant = variants[status] || variants.pending;
  return (
    <Badge
      variant="outline"
      className={`${variant.color} flex items-center gap-1.5 w-fit text-xs`}
    >
      {variant.icon}
      {variant.label}
    </Badge>
  );
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([]);
  const [recentStudents, setRecentStudents] = useState<RecentStudent[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      // All current (non-superseded) registrations — used for stats + breakdown.
      const { data: regs, error: regsError } = await supabase
        .from("exam_registrations")
        .select("id, exam, status, student_id, created_at")
        .eq("is_current", true);

      if (regsError) {
        setError(regsError.message);
        setLoading(false);
        return;
      }

      setRegistrations(regs as RegistrationRow[]);

      // Last 10 students, with their current exam registrations nested.
      const { data: students, error: studentsError } = await supabase
        .from("students")
        .select(
          "id, full_name, created_at, exam_registrations(exam, status, is_current)",
        )
        .order("created_at", { ascending: false })
        .limit(10);

      if (studentsError) {
        setError(studentsError.message);
        setLoading(false);
        return;
      }

      const mapped: RecentStudent[] = (students ?? []).map((s: any) => ({
        id: s.id,
        full_name: s.full_name,
        created_at: s.created_at,
        exams: (s.exam_registrations ?? [])
          .filter((r: any) => r.is_current)
          .map((r: any) => ({ exam: r.exam, status: r.status })),
      }));

      setRecentStudents(mapped);
      setLoading(false);
    }

    load();
  }, []);

  const stats = [
    { label: "Total Submissions", value: registrations.length },
    {
      label: "Pending Review",
      value: registrations.filter((r) => r.status === "pending").length,
      highlight: true,
    },
    {
      label: "Approved",
      value: registrations.filter((r) => r.status === "approved").length,
    },
    {
      label: "Rejected",
      value: registrations.filter((r) => r.status === "rejected").length,
    },
  ];

  const examBreakdown = EXAMS.map((exam) => {
    const rows = registrations.filter((r) => r.exam === exam);
    return {
      exam,
      total: rows.length,
      pending: rows.filter((r) => r.status === "pending").length,
      approved: rows.filter((r) => r.status === "approved").length,
      rejected: rows.filter((r) => r.status === "rejected").length,
    };
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <p className="text-red-600">Failed to load dashboard: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-50">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Overview of exam registrations and submissions
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <Card
              key={idx}
              className={
                stat.highlight ? "border-0 shadow-md" : "border-gray-200"
              }
              style={
                stat.highlight
                  ? {
                      background:
                        "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                    }
                  : {}
              }
            >
              <CardContent className="pt-6">
                <div className="flex flex-col gap-2">
                  <p
                    className={`text-sm font-medium ${stat.highlight ? "text-amber-900" : "text-gray-600"}`}
                  >
                    {stat.label}
                  </p>
                  <p
                    className={`text-3xl font-bold ${stat.highlight ? "text-amber-950" : "text-gray-50"}`}
                  >
                    {stat.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Exam Breakdown Section */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg">
              Registration Breakdown by Exam
            </CardTitle>
            <CardDescription>
              Distribution across the four ACCA exams
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200">
                  <TableHead className="text-gray-400 font-semibold">
                    Exam
                  </TableHead>
                  <TableHead className="text-right text-gray-400 font-semibold">
                    Total
                  </TableHead>
                  <TableHead className="text-right text-gray-400 font-semibold">
                    Pending
                  </TableHead>
                  <TableHead className="text-right text-gray-400 font-semibold">
                    Approved
                  </TableHead>
                  <TableHead className="text-right text-gray-400 font-semibold">
                    Rejected
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {examBreakdown.map((row, idx) => (
                  <TableRow key={idx} className="border-gray-100">
                    <TableCell className="font-semibold text-gray-50">
                      {row.exam}
                    </TableCell>
                    <TableCell className="text-right text-gray-700">
                      {row.total}
                    </TableCell>
                    <TableCell className="text-right text-amber-600 font-medium">
                      {row.pending}
                    </TableCell>
                    <TableCell className="text-right text-green-600 font-medium">
                      {row.approved}
                    </TableCell>
                    <TableCell className="text-right text-red-600 font-medium">
                      {row.rejected}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Submissions Section */}
        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Submissions</CardTitle>
              <CardDescription>
                Latest 10 students who submitted
              </CardDescription>
            </div>
            <a
              href="/admin/submissions"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all submissions →
            </a>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200">
                  <TableHead className="text-gray-700 font-semibold">
                    Student Name
                  </TableHead>
                  <TableHead className="text-gray-700 font-semibold">
                    Exams
                  </TableHead>
                  <TableHead className="text-gray-700 font-semibold">
                    Submitted
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentStudents.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-gray-500 py-8"
                    >
                      No submissions yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentStudents.map((student) => (
                    <TableRow
                      key={student.id}
                      className="border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() =>
                        (window.location.href = `/admin/submissions/${student.id}`)
                      }
                    >
                      <TableCell className="font-medium text-gray-50">
                        {student.full_name}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {student.exams.map((e, i) => (
                            <span key={i}>{getStatusBadge(e.status)}</span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm">
                        {new Date(student.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
