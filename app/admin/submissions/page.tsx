"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";

type ExamCode = "BT" | "MA" | "FA" | "CBL";
type Status = "pending" | "approved" | "rejected" | "rescheduled";

interface SubmissionRow {
  registrationId: string;
  studentId: string;
  name: string;
  email: string;
  exam: ExamCode;
  preferredDate: string;
  preferredTime: string;
  status: Status;
  submitted: string;
}

const TIME_LABELS: Record<string, string> = {
  "09:45": "9:45 AM",
  "12:15": "12:15 PM",
  "14:15": "2:15 PM",
};

function getStatusBadge(status: Status) {
  const variants: Record<Status, { color: string; label: string }> = {
    pending: {
      color: "bg-amber-100 text-amber-800 border-amber-200",
      label: "Pending",
    },
    approved: {
      color: "bg-green-100 text-green-800 border-green-200",
      label: "Approved",
    },
    rejected: {
      color: "bg-red-100 text-red-800 border-red-200",
      label: "Rejected",
    },
    rescheduled: {
      color: "bg-blue-100 text-blue-800 border-blue-200",
      label: "Rescheduled",
    },
  };
  const variant = variants[status] || variants.pending;
  return (
    <Badge variant="outline" className={variant.color}>
      {variant.label}
    </Badge>
  );
}

export default function SubmissionsPage() {
  const router = useRouter();

  const [rows, setRows] = useState<SubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExam, setSelectedExam] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedDateRange, setSelectedDateRange] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("exam_registrations")
        .select(
          "id, exam, preferred_date, preferred_time, status, created_at, student:students(id, full_name, email)",
        )
        .eq("is_current", true)
        .order("created_at", { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      const mapped: SubmissionRow[] = (data ?? []).map((r: any) => ({
        registrationId: r.id,
        studentId: r.student.id,
        name: r.student.full_name,
        email: r.student.email,
        exam: r.exam,
        preferredDate: r.preferred_date,
        preferredTime: r.preferred_time,
        status: r.status,
        submitted: r.created_at,
      }));

      setRows(mapped);
      setLoading(false);
    }

    load();
  }, []);

  const filteredSubmissions = useMemo(() => {
    return rows.filter((row) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        row.name.toLowerCase().includes(searchLower) ||
        row.email.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;

      if (selectedExam !== "all" && row.exam !== selectedExam) return false;
      if (selectedStatus !== "all" && row.status !== selectedStatus)
        return false;

      if (selectedDateRange !== "all") {
        const submittedDate = new Date(row.submitted);
        const today = new Date();
        const oneDayAgo = new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(
          today.getTime() - 7 * 24 * 60 * 60 * 1000,
        );
        const thirtyDaysAgo = new Date(
          today.getTime() - 30 * 24 * 60 * 60 * 1000,
        );

        if (selectedDateRange === "1day" && submittedDate < oneDayAgo)
          return false;
        if (selectedDateRange === "7days" && submittedDate < sevenDaysAgo)
          return false;
        if (selectedDateRange === "30days" && submittedDate < thirtyDaysAgo)
          return false;
      }

      return true;
    });
  }, [rows, searchTerm, selectedExam, selectedStatus, selectedDateRange]);

  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);
  const paginatedSubmissions = filteredSubmissions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleFilterChange = (callback: () => void) => {
    callback();
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedExam("all");
    setSelectedStatus("all");
    setSelectedDateRange("all");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchTerm !== "" ||
    selectedExam !== "all" ||
    selectedStatus !== "all" ||
    selectedDateRange !== "all";

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Loading submissions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <p className="text-red-600">Failed to load submissions: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            All Submissions
          </h1>
          <p className="text-muted-foreground mt-1">
            {filteredSubmissions.length} of {rows.length} exam registrations
          </p>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) =>
                  handleFilterChange(() => setSearchTerm(e.target.value))
                }
                className="pl-10 border-border"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                value={selectedExam}
                onValueChange={(value) =>
                  handleFilterChange(() => setSelectedExam(value))
                }
              >
                <SelectTrigger className="border-border">
                  <SelectValue placeholder="All Exams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Exams</SelectItem>
                  <SelectItem value="BT">
                    BT (Business and Technology)
                  </SelectItem>
                  <SelectItem value="MA">MA (Management Accounting)</SelectItem>
                  <SelectItem value="FA">FA (Financial Accounting)</SelectItem>
                  <SelectItem value="CBL">
                    CBL (Corporate and Business Law)
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={selectedStatus}
                onValueChange={(value) =>
                  handleFilterChange(() => setSelectedStatus(value))
                }
              >
                <SelectTrigger className="border-border">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="rescheduled">Rescheduled</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={selectedDateRange}
                onValueChange={(value) =>
                  handleFilterChange(() => setSelectedDateRange(value))
                }
              >
                <SelectTrigger className="border-border">
                  <SelectValue placeholder="All Dates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="1day">Last 24 Hours</SelectItem>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <div className="flex justify-end">
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  size="sm"
                  className="border-border text-foreground hover:bg-muted"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {filteredSubmissions.length === 0 ? (
          <Card className="border-border">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                No submissions match your filters.
              </p>
              {hasActiveFilters && (
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="border-border text-foreground hover:bg-muted"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="border-border">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border bg-background">
                        <TableHead className="text-foreground font-semibold">
                          Student
                        </TableHead>
                        <TableHead className="text-foreground font-semibold">
                          Email
                        </TableHead>
                        <TableHead className="text-foreground font-semibold">
                          Exam
                        </TableHead>
                        <TableHead className="text-foreground font-semibold">
                          Preferred Date
                        </TableHead>
                        <TableHead className="text-foreground font-semibold">
                          Time Slot
                        </TableHead>
                        <TableHead className="text-foreground font-semibold">
                          Status
                        </TableHead>
                        <TableHead className="text-foreground font-semibold">
                          Submitted
                        </TableHead>
                        <TableHead className="text-foreground font-semibold text-right">
                          Action
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedSubmissions.map((row) => (
                        <TableRow
                          key={row.registrationId}
                          className="border-border hover:bg-background transition-colors"
                        >
                          <TableCell className="font-medium text-foreground">
                            {row.name}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {row.email}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className="bg-muted text-foreground text-xs"
                            >
                              {row.exam}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {row.preferredDate}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {TIME_LABELS[row.preferredTime] ??
                              row.preferredTime}
                          </TableCell>
                          <TableCell>{getStatusBadge(row.status)}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {new Date(row.submitted).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-border text-foreground hover:bg-blue-50 hover:text-blue-700"
                              onClick={() =>
                                router.push(
                                  `/admin/submissions/${row.studentId}`,
                                )
                              }
                            >
                              Review
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(
                    currentPage * itemsPerPage,
                    filteredSubmissions.length,
                  )}{" "}
                  of {filteredSubmissions.length} results
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    className="border-border"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="flex items-center gap-2 px-3 text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    className="border-border"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
