"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// "2026-10-20" -> "2026-10-21" (check-out must be at least one day after check-in)
function nextDay(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

// Check-in / check-out pair for the search form. It reacts while the guest is
// picking, so the check-out calendar greys out every day up to the check-in.
export function DateRangeFields({
  minDate,
  defaultCheckIn = "",
  defaultCheckOut = "",
}: {
  minDate: string; // yyyy-mm-dd, computed on the server
  defaultCheckIn?: string;
  defaultCheckOut?: string;
}) {
  const [checkIn, setCheckIn] = useState(defaultCheckIn);
  const [checkOut, setCheckOut] = useState(defaultCheckOut);

  function onCheckInChange(value: string) {
    setCheckIn(value);
    // Drop a check-out that is no longer after the new check-in.
    if (value && checkOut && checkOut < nextDay(value)) setCheckOut("");
  }

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="checkIn">Check-in</Label>
        <Input
          id="checkIn"
          name="checkIn"
          type="date"
          min={minDate}
          value={checkIn}
          onChange={(e) => onCheckInChange(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="checkOut">Check-out</Label>
        <Input
          id="checkOut"
          name="checkOut"
          type="date"
          min={checkIn ? nextDay(checkIn) : minDate}
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
        />
      </div>
    </>
  );
}
