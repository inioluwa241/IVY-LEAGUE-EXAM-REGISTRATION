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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type ExamCode = "BT" | "MA" | "FA" | "CBL";

const EXAM_NAMES: Record<ExamCode, string> = {
  BT: "Business and Technology",
  MA: "Management Accounting",
  FA: "Financial Accounting",
  CBL: "Corporate and Business Law",
};

const EXAMS: ExamCode[] = ["BT", "MA", "FA", "CBL"];

interface PriceRow {
  exam: ExamCode;
  price_kobo: number;
}

function koboToNaira(kobo: number): string {
  return (kobo / 100).toString();
}

function nairaToKobo(naira: string): number {
  const parsed = parseFloat(naira);
  return Math.round((Number.isNaN(parsed) ? 0 : parsed) * 100);
}

export default function PricingPage() {
  const [prices, setPrices] = useState<Record<ExamCode, number>>({
    BT: 0,
    MA: 0,
    FA: 0,
    CBL: 0,
  });
  const [nairaInputs, setNairaInputs] = useState<Record<ExamCode, string>>({
    BT: "",
    MA: "",
    FA: "",
    CBL: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingExam, setSavingExam] = useState<ExamCode | null>(null);
  const [savedExam, setSavedExam] = useState<ExamCode | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("exam_prices")
        .select("exam, price_kobo");

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      const priceMap = { BT: 0, MA: 0, FA: 0, CBL: 0 } as Record<
        ExamCode,
        number
      >;
      const nairaMap = { BT: "", MA: "", FA: "", CBL: "" } as Record<
        ExamCode,
        string
      >;

      (data as PriceRow[]).forEach((row) => {
        priceMap[row.exam] = row.price_kobo;
        nairaMap[row.exam] = koboToNaira(row.price_kobo);
      });

      setPrices(priceMap);
      setNairaInputs(nairaMap);
      setLoading(false);
    }

    load();
  }, []);

  async function handleSave(exam: ExamCode) {
    setSavingExam(exam);
    setSavedExam(null);
    setError(null);

    const newKobo = nairaToKobo(nairaInputs[exam]);

    const { data: userData } = await supabase.auth.getUser();

    const { error: updateError } = await supabase
      .from("exam_prices")
      .update({
        price_kobo: newKobo,
        updated_by: userData.user?.id ?? null,
      })
      .eq("exam", exam);

    if (updateError) {
      setError(updateError.message);
      setSavingExam(null);
      return;
    }

    setPrices((prev) => ({ ...prev, [exam]: newKobo }));
    setSavingExam(null);
    setSavedExam(exam);
    setTimeout(() => setSavedExam(null), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Loading prices...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Exam Pricing</h1>
          <p className="text-muted-foreground mt-1">
            Set the current price for each exam. Students pay the total for
            whichever exams they select, all in one transaction.
          </p>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="space-y-4">
          {EXAMS.map((exam) => (
            <Card key={exam}>
              <CardHeader>
                <CardTitle className="text-base">
                  {exam} — {EXAM_NAMES[exam]}
                </CardTitle>
                <CardDescription>
                  Current price: ₦{(prices[exam] / 100).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-3">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`price-${exam}`}>New price (₦)</Label>
                    <Input
                      id={`price-${exam}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={nairaInputs[exam]}
                      onChange={(e) =>
                        setNairaInputs((prev) => ({
                          ...prev,
                          [exam]: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <Button
                    onClick={() => handleSave(exam)}
                    disabled={savingExam === exam}
                  >
                    {savingExam === exam
                      ? "Saving..."
                      : savedExam === exam
                        ? "Saved ✓"
                        : "Save"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
