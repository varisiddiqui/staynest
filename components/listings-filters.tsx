import Link from "next/link";
import { DateRangeFields } from "@/components/date-range-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ListingFilters } from "@/lib/listings";

const selectClass =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

// A plain GET form: the filters live in the URL, so results are shareable
// and the page works without any client-side state.
export function ListingsFilters({
  cities,
  values,
  minDate,
}: {
  cities: string[];
  values: ListingFilters;
  minDate: string; // yyyy-mm-dd: earliest date a guest can pick
}) {
  return (
    <form
      method="get"
      action="/listings"
      className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-6"
    >
      <div className="space-y-2 lg:col-span-2">
        <Label htmlFor="q">Search</Label>
        <Input
          id="q"
          name="q"
          placeholder="Beach, haveli, houseboat..."
          defaultValue={values.q ?? ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="city">City</Label>
        <select
          id="city"
          name="city"
          defaultValue={values.city ?? ""}
          className={selectClass}
        >
          <option value="">All cities</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <DateRangeFields
        minDate={minDate}
        defaultCheckIn={values.checkIn ?? ""}
        defaultCheckOut={values.checkOut ?? ""}
      />

      <div className="space-y-2">
        <Label htmlFor="guests">Guests</Label>
        <Input
          id="guests"
          name="guests"
          type="number"
          min={1}
          placeholder="2"
          defaultValue={values.guests ?? ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="maxPrice">Max price / night</Label>
        <Input
          id="maxPrice"
          name="maxPrice"
          type="number"
          min={1}
          placeholder="e.g. 4000"
          defaultValue={values.maxPrice ?? ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sort">Sort by</Label>
        <select
          id="sort"
          name="sort"
          defaultValue={values.sort}
          className={selectClass}
        >
          <option value="rating">Top rated</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-4 lg:self-end">
        <Button type="submit">Search</Button>
        <Link
          href="/listings"
          className="text-sm text-muted-foreground underline underline-offset-4"
        >
          Reset
        </Link>
        <span className="text-xs text-muted-foreground">
          Pick both dates to see only stays that are free.
        </span>
      </div>
    </form>
  );
}
