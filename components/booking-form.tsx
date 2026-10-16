"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBooking, type BookingState } from "@/app/listings/[id]/actions";
import { formatINR } from "@/lib/format";
import type { BookedRange } from "@/lib/types";

const DAY_MS = 24 * 60 * 60 * 1000;

export function BookingForm({
  listingId,
  pricePerNight,
  maxGuests,
  minDate,
  booked,
  defaultCheckIn = "",
  defaultCheckOut = "",
  defaultGuests = 1,
}: {
  listingId: string;
  pricePerNight: number;
  maxGuests: number;
  minDate: string; // yyyy-mm-dd, computed on the server
  booked: BookedRange[];
  defaultCheckIn?: string;
  defaultCheckOut?: string;
  defaultGuests?: number;
}) {
  const [state, formAction, pending] = useActionState<BookingState, FormData>(
    createBooking.bind(null, listingId),
    {}
  );
  const [checkIn, setCheckIn] = useState(defaultCheckIn);
  const [checkOut, setCheckOut] = useState(defaultCheckOut);

  // Display-only estimate. The database recalculates the real price.
  const nights =
    checkIn && checkOut
      ? Math.round((Date.parse(checkOut) - Date.parse(checkIn)) / DAY_MS)
      : 0;
  const total = nights > 0 ? nights * pricePerNight : 0;

  // Ranges are [check_in, check_out): checking in on someone's check-out day is fine.
  // yyyy-mm-dd strings compare correctly as plain text.
  const clashes =
    checkIn !== "" &&
    checkOut !== "" &&
    checkOut > checkIn &&
    booked.some((r) => checkIn < r.check_out && checkOut > r.check_in);

  const startGuests = Math.min(Math.max(defaultGuests, 1), maxGuests);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="check_in">Check-in</Label>
          <Input
            id="check_in"
            name="check_in"
            type="date"
            required
            min={minDate}
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="check_out">Check-out</Label>
          <Input
            id="check_out"
            name="check_out"
            type="date"
            required
            min={checkIn || minDate}
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="guests">Guests (max {maxGuests})</Label>
        <Input
          id="guests"
          name="guests"
          type="number"
          required
          min={1}
          max={maxGuests}
          defaultValue={startGuests}
        />
      </div>

      {clashes && (
        <p role="alert" className="text-sm text-red-600">
          These dates overlap an existing booking. Please pick other dates.
        </p>
      )}

      {total > 0 && !clashes && (
        <p className="text-sm">
          {nights} {nights === 1 ? "night" : "nights"} ×{" "}
          {formatINR(pricePerNight)} ={" "}
          <span className="font-semibold">{formatINR(total)}</span>
        </p>
      )}

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={pending || clashes}>
        {pending ? "Booking..." : "Book now"}
      </Button>
    </form>
  );
}
