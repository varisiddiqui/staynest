"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ListingFormState } from "@/app/host/actions";
import type { Listing } from "@/lib/types";

export function ListingForm({
  action,
  defaults,
  submitLabel,
}: {
  action: (
    state: ListingFormState,
    formData: FormData
  ) => Promise<ListingFormState>;
  defaults?: Listing;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<
    ListingFormState,
    FormData
  >(action, {});

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          required
          maxLength={120}
          defaultValue={defaults?.title ?? ""}
          placeholder="Sea-view studio near the beach"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={defaults?.description ?? ""}
          placeholder="What makes this place special?"
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            name="city"
            required
            defaultValue={defaults?.city ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            name="country"
            defaultValue={defaults?.country ?? "India"}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price_per_night">Price per night (₹)</Label>
          <Input
            id="price_per_night"
            name="price_per_night"
            type="number"
            min={1}
            required
            defaultValue={defaults?.price_per_night ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="max_guests">Max guests</Label>
          <Input
            id="max_guests"
            name="max_guests"
            type="number"
            min={1}
            required
            defaultValue={defaults?.max_guests ?? 2}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="image_url">Image URL (optional)</Label>
        <Input
          id="image_url"
          name="image_url"
          type="url"
          defaultValue={defaults?.image_url ?? ""}
          placeholder="https://..."
        />
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
