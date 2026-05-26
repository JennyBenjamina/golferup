"use client";

import { useState, useEffect } from "react";
import { Clock, AlertTriangle } from "lucide-react";

interface PaymentCountdownProps {
  deadline: Date | string;
  onExpired?: () => void;
  compact?: boolean;
}

function getTimeLeft(deadline: Date) {
  const diff = deadline.getTime() - Date.now();
  if (diff <= 0) return null;

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { hours, minutes, seconds, total: diff };
}

export function PaymentCountdown({
  deadline,
  onExpired,
  compact = false,
}: PaymentCountdownProps) {
  const deadlineDate =
    typeof deadline === "string" ? new Date(deadline) : deadline;
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(deadlineDate));

  useEffect(() => {
    const timer = setInterval(() => {
      const left = getTimeLeft(deadlineDate);
      setTimeLeft(left);
      if (!left) {
        clearInterval(timer);
        onExpired?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [deadlineDate, onExpired]);

  // Expired
  if (!timeLeft) {
    return (
      <div className="flex items-center gap-2 text-red-600">
        <AlertTriangle className="w-4 h-4" />
        <span className="text-sm font-medium">Payment deadline expired</span>
      </div>
    );
  }

  const isUrgent = timeLeft.total < 2 * 60 * 60 * 1000; // under 2 hours
  const pad = (n: number) => String(n).padStart(2, "0");

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 text-xs font-medium ${
          isUrgent ? "text-red-600" : "text-amber-600"
        }`}
      >
        <Clock className="w-3 h-3" />
        {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
      </span>
    );
  }

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
        isUrgent
          ? "bg-red-50 border-red-200"
          : "bg-amber-50 border-amber-200"
      }`}
    >
      <Clock
        className={`w-5 h-5 shrink-0 ${
          isUrgent ? "text-red-500" : "text-amber-500"
        }`}
      />
      <div className="flex-1">
        <p
          className={`text-sm font-medium ${
            isUrgent ? "text-red-800" : "text-amber-800"
          }`}
        >
          {isUrgent ? "Payment due soon!" : "Payment deadline"}
        </p>
        <p
          className={`text-xs mt-0.5 ${
            isUrgent ? "text-red-600" : "text-amber-600"
          }`}
        >
          {timeLeft.hours > 0 && `${timeLeft.hours}h `}
          {pad(timeLeft.minutes)}m {pad(timeLeft.seconds)}s remaining
        </p>
      </div>
      <div
        className={`text-lg font-mono font-bold tabular-nums ${
          isUrgent ? "text-red-700" : "text-amber-700"
        }`}
      >
        {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
      </div>
    </div>
  );
}
