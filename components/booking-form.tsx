"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBooking, type BookingState } from "@/app/listings/[id]/actions";
import { formatINR } from "@/lib/format";

const DAY_MS = 24 * 60 * 60 * 1000;

export function BookingForm({
  listingId,
  pricePerNight,
  maxGuests,
  minDate,
}: {
  listingId: string;
  pricePerNight: number;
  maxGuests: number;
  minDate: string; // yyyy-mm-dd, computed on the server
}) {
  const [state, formAction, pending] = useActionState<BookingState, FormData>(
    createBooking.bind(null, listingId),
    {}
  );
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");

  // Display-only estimate. The database recalculates the real price.
  const nights =
    checkIn && checkOut
      ? Math.round((Date.parse(checkOut) - Date.parse(checkIn)) / DAY_MS)
      : 0;
  const total = nights > 0 ? nights * pricePerNight : 0;

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
          defaultValue={1}
        />
      </div>

      {total > 0 && (
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

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Booking..." : "Book now"}
      </Button>
    </form>
  );
}
