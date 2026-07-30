"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface Exam {
  id: string;
  name: string;
  selected: boolean;
  date: string;
  timeSlot: string;
}

interface Props {
  exams: Exam[];
  prices: Record<string, number>;
  email: string;
  paymentReference: string | null;
  onPaymentSuccess: (reference: string) => void;
}

declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: {
        key: string;
        email: string;
        amount: number;
        currency: string;
        ref: string;
        onClose: () => void;
        callback: (response: { reference: string }) => void;
      }) => { openIframe: () => void };
    };
  }
}

export default function PaymentSection({
  exams,
  prices,
  email,
  paymentReference,
  onPaymentSuccess,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedExams = exams.filter((exam) => exam.selected);
  const totalKobo = selectedExams.reduce(
    (sum, exam) => sum + (prices[exam.id] ?? 0),
    0,
  );

  // Load Paystack script directly into the form element
  useEffect(() => {
    if (!formRef.current || scriptReady) return;

    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    script.onload = () => setScriptReady(true);
    script.onerror = () => setError("Failed to load payment system");

    formRef.current.appendChild(script);

    return () => {
      if (formRef.current && script.parentNode === formRef.current) {
        formRef.current.removeChild(script);
      }
    };
  }, [scriptReady]);

  function handlePay() {
    setError(null);

    if (!window.PaystackPop) {
      setError(
        "Payment system is still loading — please wait a moment and try again.",
      );
      return;
    }

    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    if (!publicKey) {
      setError("Payment is not configured. Please contact support.");
      return;
    }

    setPaying(true);

    const reference = `ivy_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    const handler = window.PaystackPop.setup({
      key: publicKey,
      email,
      amount: totalKobo,
      currency: "NGN",
      ref: reference,
      onClose: () => {
        setPaying(false);
      },
      callback: (response) => {
        setPaying(false);
        onPaymentSuccess(response.reference);
      },
    });

    handler.openIframe();
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {selectedExams.map((exam) => (
          <div key={exam.id} className="flex justify-between text-sm">
            <span>{exam.name}</span>
            <span className="text-muted-foreground">
              ₦{((prices[exam.id] ?? 0) / 100).toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center pt-3 border-t font-medium">
        <span>Total</span>
        <span>₦{(totalKobo / 100).toLocaleString()}</span>
      </div>

      {paymentReference ? (
        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm text-green-900 dark:text-green-100">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Payment received. You can proceed to pick your exam dates.
        </div>
      ) : (
        <form ref={formRef} onSubmit={(e) => e.preventDefault()}>
          <Button
            type="button"
            onClick={handlePay}
            disabled={paying || !scriptReady || totalKobo === 0}
            className="w-full"
          >
            {paying
              ? "Waiting for payment..."
              : `Pay ₦${(totalKobo / 100).toLocaleString()}`}
          </Button>
          {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        </form>
      )}
    </div>
  );
}
