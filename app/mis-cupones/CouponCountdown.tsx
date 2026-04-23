"use client";

import { useEffect, useMemo, useState } from "react";

function getTimeLeft(expiresAt: string | null | undefined) {
  const raw = String(expiresAt || "").trim();
  if (!raw) return null;

  const target = new Date(raw).getTime();
  if (!Number.isFinite(target)) return null;

  const diff = Math.max(0, target - Date.now());
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    expired: diff <= 0,
    days,
    hours,
    minutes,
    seconds,
  };
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export default function CouponCountdown({ expiresAt }: { expiresAt?: string | null }) {
  const [now, setNow] = useState(() => Date.now());
  const timeLeft = useMemo(() => {
    void now;
    return getTimeLeft(expiresAt);
  }, [expiresAt, now]);

  useEffect(() => {
    if (!expiresAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);

  if (!timeLeft) {
    return (
      <div className="couponCountdown" aria-label="Sin fecha de vencimiento">
        <span className="countIcon" aria-hidden="true">◷</span>
        <span>Sin vencimiento</span>
      </div>
    );
  }

  if (timeLeft.expired) {
    return (
      <div className="couponCountdown expired" aria-label="Cupon vencido">
        <span className="countIcon" aria-hidden="true">◷</span>
        <span>Vencido</span>
      </div>
    );
  }

  return (
    <div className="couponCountdown" aria-label="Tiempo restante para usar el cupon">
      <span className="countIcon" aria-hidden="true">◷</span>
      <span>
        {timeLeft.days > 0 ? `${timeLeft.days}d ` : ""}
        {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
      </span>
    </div>
  );
}
